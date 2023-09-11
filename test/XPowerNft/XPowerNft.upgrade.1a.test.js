const { ethers } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Nft; // contract
let moe, nft; // instance
let UNIT; // decimals

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";

describe("XPowerNft", async function () {
  before(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
    addresses = accounts.map((acc) => acc.address);
    expect(addresses.length).to.be.greaterThan(1);
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
    await moe.grantRole(moe.TRANSFER_ROLE(), addresses[0]);
    await moe.transferOwnership(addresses[1]);
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
    await moe.grantRole(moe.TRANSFER_ROLE(), addresses[1]);
    await moe.connect(signer_1).transferOwnership(owner.address);
  });
  describe("upgrade", async function () {
    it("should upgrade NFTs for level=KILO & amount=1", async function () {
      await moeMint(15 * 67);
      await allowanceOf(1005);
      await nftMint(1005);
      await nftUpgrade(1, 3);
    });
  });
});
async function allowanceOf(n) {
  const [owner, spender] = [addresses[0], nft.target];
  const increase = await moe.increaseAllowance(spender, BigInt(n) * UNIT);
  expect(increase).to.be.an("object");
  const allowance = await moe.allowance(owner, spender);
  expect(allowance).to.eq(BigInt(n) * UNIT);
}
async function moeMint(n) {
  const tx = await moe.fake(addresses[0], BigInt(n) * UNIT);
  expect(tx).to.be.an("object");
}
async function nftMint(n, l = 0) {
  const year = await nft.year();
  expect(year).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(addresses[0]);
  await nft.mint(addresses[0], l, n);
  const new_balance = await moe.balanceOf(addresses[0]);
  expect(old_balance - new_balance).to.eq(BigInt(n) * 10n ** BigInt(l) * UNIT);
  const nft_id = await nft.idBy(year, l);
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await nft.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(n);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply).to.eq(n);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_XPOW_URL);
}
async function nftUpgrade(n, l = 0) {
  const year = await nft.year();
  expect(year).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(addresses[0]);
  await nft.upgrade(addresses[0], year, l, n);
  const new_balance = await moe.balanceOf(addresses[0]);
  expect(old_balance - new_balance).to.eq(0);
  const nft_id = await nft.idBy(year, l);
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await nft.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(n);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply).to.eq(n);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_XPOW_URL);
}
