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
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.be.an("object");
    Moe = await ethers.getContractFactory("XPowerTest");
    expect(Moe).to.be.an("object");
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
  describe("upgradeBatch", async function () {
    it("should upgrade NFTs for level=KILO & amount=1", async function () {
      await moeMint(15 * 67);
      await allowanceOf(1005);
      await nftMintBatch(1005);
      await nftUpgradeBatch(1, 3);
    });
    it("should upgrade NFTs for level=KILO & amount=1 (other)", async function () {
      const [owner, other] = [accounts[0], accounts[1]];
      await moeMint(15 * 67);
      await allowanceOf(1005);
      await nftMintApprove(owner, other);
      await nftMintBatch(1005, 0, owner, other);
      await nftUpgradeApprove(owner, other);
      await nftUpgradeBatch(1, 3, owner, other);
    });
    it("should *not* upgrade NFTs for level=KILO & amount=1 (other: not approved)", async function () {
      const [owner, other] = [accounts[0], accounts[1]];
      await moeMint(15 * 67);
      await allowanceOf(1005);
      await nftMintApprove(owner, other);
      await nftMintBatch(1005, 0, owner, other);
      const tx = await nftUpgradeBatch(1, 3, owner, other).catch((ex) => {
        const m = ex.message.match(/caller is not token owner or approved/);
        if (m === null) console.debug(ex);
        expect(m).to.not.eq(null);
      });
      expect(tx).to.eq(undefined);
    });
  });
});
async function allowanceOf(n) {
  const [owner, spender] = [accounts[0], nft.target];
  const increase = await moe.increaseAllowance(spender, BigInt(n) * UNIT);
  expect(increase).to.be.an("object");
  const allowance = await moe.allowance(owner, spender);
  expect(allowance).to.eq(BigInt(n) * UNIT);
}
async function moeMint(n, a = accounts[0], d = accounts[0]) {
  const tx = await moe.connect(d).fake(a, BigInt(n) * UNIT);
  expect(tx).to.be.an("object");
}
async function nftMintApprove(a = accounts[0], d = accounts[1]) {
  expect(await nft.approvedMint(a, d)).to.eq(false);
  const tx = await nft.approveMint(d, true);
  expect(tx).to.be.an("object");
  expect(await nft.approvedMint(a, d)).to.eq(true);
  return tx;
}
async function nftUpgradeApprove(a = accounts[0], d = accounts[1]) {
  expect(await nft.approvedUpgrade(a, d)).to.eq(false);
  const tx = await nft.approveUpgrade(d, true);
  expect(tx).to.be.an("object");
  expect(await nft.approvedUpgrade(a, d)).to.eq(true);
  return tx;
}
async function nftMintBatch(n, l = 0, a = accounts[0], d = accounts[0]) {
  const year = await nft.year();
  expect(year).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(a);
  await nft.connect(d).mintBatch(a, [l], [n]);
  const new_balance = await moe.balanceOf(a);
  expect(old_balance - new_balance).to.eq(BigInt(n) * 10n ** BigInt(l) * UNIT);
  const nft_ids = await nft.idsBy(year, [l]);
  expect(nft_ids.length).to.be.greaterThan(0);
  const nft_id = nft_ids[0];
  expect(nft_ids.length).to.equal(1);
  const nft_balance = await nft.balanceOf(a, nft_id);
  expect(nft_balance).to.eq(n);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply).to.eq(n);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_XPOW_URL);
}
async function nftUpgradeBatch(n, l = 0, a = accounts[0], d = accounts[0]) {
  const year = await nft.year();
  expect(year).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(a);
  const [years, units, amounts] = [[year], [[l]], [[n]]];
  await nft.connect(d).upgradeBatch(a, years, units, amounts);
  const new_balance = await moe.balanceOf(a);
  expect(old_balance - new_balance).to.eq(0);
  const nft_ids = await nft.idsBy(year, [l]);
  expect(nft_ids.length).to.equal(1);
  const nft_id = nft_ids[0];
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
