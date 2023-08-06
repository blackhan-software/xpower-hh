/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Nft; // contracts
let moe, nft; // instances
let UNIT; // decimals

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
const DEADLINE = 0; // [seconds]

describe("XPowerNft", async function () {
  before(async function () {
    await network.provider.send("hardhat_reset");
  });
  before(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
    addresses = accounts.map((acc) => acc.address);
    expect(addresses.length).to.be.greaterThan(1);
  });
  before(async function () {
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.exist;
    Moe = await ethers.getContractFactory("XPowerTest");
    expect(Moe).to.exist;
  });
  beforeEach(async function () {
    moe = await Moe.deploy([], DEADLINE);
    expect(moe).to.exist;
    await moe.deployed();
    await moe.transferOwnership(addresses[1]);
    await moe.init();
  });
  beforeEach(async function () {
    const decimals = await moe.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.be.true;
  });
  beforeEach(async function () {
    nft = await Nft.deploy(moe.address, NFT_XPOW_URL, [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
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
  });
});
async function allowanceOf(n) {
  const [owner, spender] = [addresses[0], nft.address];
  const increase = await moe.increaseAllowance(spender, BigInt(n) * UNIT);
  expect(increase).to.be.an("object");
  const allowance = await moe.allowance(owner, spender);
  expect(allowance).to.eq(BigInt(n) * UNIT);
}
async function moeMint(n) {
  const tx = await moe.fake(addresses[0], BigInt(n) * UNIT);
  expect(tx).to.be.an("object");
}
async function nftMintBatch(n, l = 0) {
  const year = (await nft.year()).toNumber();
  expect(year).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(addresses[0]);
  await nft.mintBatch(addresses[0], [l], [n]);
  const new_balance = await moe.balanceOf(addresses[0]);
  expect(old_balance.sub(new_balance)).to.eq(
    BigInt(n) * 10n ** BigInt(l) * UNIT
  );
  const nft_ids = await nft.idsBy(year, [l]);
  expect(nft_ids.length).to.be.greaterThan(0);
  const nft_id = nft_ids[0].toNumber();
  expect(nft_ids.length).to.equal(1);
  const nft_balance = await nft.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(n);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply.toNumber()).to.eq(n);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_XPOW_URL);
}
async function nftUpgradeBatch(n, l = 0) {
  const year = await nft.year();
  expect(year.toNumber()).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(addresses[0]);
  const [years, units, amounts] = [[year], [[l]], [[n]]];
  await nft.upgradeBatch(addresses[0], years, units, amounts);
  const new_balance = await moe.balanceOf(addresses[0]);
  expect(old_balance.sub(new_balance)).to.eq(0);
  const nft_ids = await nft.idsBy(year, [l]);
  expect(nft_ids.length).to.equal(1);
  const nft_id = nft_ids[0].toNumber();
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await nft.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(n);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply.toNumber()).to.eq(n);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_XPOW_URL);
}
