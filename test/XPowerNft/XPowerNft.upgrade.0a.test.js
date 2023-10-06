const { ethers } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let Moe, Nft; // contract
let moe, nft; // instance
let UNIT; // decimals

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";

describe("XPowerNft", async function () {
  before(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
  });
  before(async function () {
    Moe = await ethers.getContractFactory("XPowerTest");
    expect(Moe).to.be.an("object");
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.be.an("object");
  });
  beforeEach(async function () {
    moe = await Moe.deploy([], 0);
    expect(moe).to.be.an("object");
    await moe.transferOwnership(accounts[1]);
    await moe.init();
  });
  beforeEach(async function () {
    const decimals = await moe.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.eq(true);
  });
  beforeEach(async function () {
    nft = await Nft.deploy(moe.target, NFT_XPOW_URL, [], 0);
    expect(nft).to.be.an("object");
  });
  after(async function () {
    const [owner, signer_1] = await ethers.getSigners();
    await moe.connect(signer_1).transferOwnership(owner.address);
  });
  describe("upgrade", async function () {
    it("should *not* upgrade NFTs (non-ternary level)", async function () {
      const tx = await nftUpgrade(1, 1).catch((ex) => {
        const m = ex.message.match(/non-ternary level/);
        if (m === null) console.debug(ex);
        expect(m).to.not.eq(null);
      });
      expect(tx).to.eq(undefined);
    });
    it("should *not* upgrade NFTs (burn amount exceeds total-supply)", async function () {
      const tx = await nftUpgrade(1, 3).catch((ex) => {
        const m = ex.message.match(/burn amount exceeds totalSupply/);
        if (m === null) console.debug(ex);
        expect(m).to.not.eq(null);
      });
      expect(tx).to.eq(undefined);
    });
  });
});
async function nftUpgrade(n, l = 0, a = accounts[0], d = accounts[0]) {
  const year = await nft.year();
  expect(year).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(a);
  await nft.connect(d).upgrade(a, year, l, n);
  const new_balance = await moe.balanceOf(a);
  expect(old_balance - new_balance).to.eq(0);
  const nft_id = await nft.idBy(year, l);
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await nft.balanceOf(a, nft_id);
  expect(nft_balance).to.eq(n);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply).to.eq(n);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_XPOW_URL);
}
