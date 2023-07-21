/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Nft; // contracts
let moe, nft; // instances
let UNIT; // decimals

const { HashTable } = require("../hash-table");
const tables = {}; // pre-hashed nonces

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years
const DAYS = 86_400; // [seconds]

describe("XPowerNft", async function () {
  before(async function () {
    await network.provider.send("hardhat_reset");
  });
  before(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
    addresses = accounts.map((acc) => acc.address);
    expect(addresses.length).to.be.greaterThan(15);
  });
  before(async function () {
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.exist;
    Moe = await ethers.getContractFactory("XPower");
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
    const a0 = addresses[0];
    tables[a0] = await new HashTable(moe, a0).init({
      min_level: 4,
      max_level: 4,
      length: 67,
    });
    const a2 = addresses[2];
    tables[a2] = await new HashTable(moe, a2).init({
      min_level: 4,
      max_level: 4,
      length: 67,
    });
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
  describe("burn", async function () {
    it("should *not* burn NFTs (irredeemable issue)", async function () {
      for (let i = 0; i < 67; i++) await moeMint(15);
      await allowanceOf(1005);
      await nftMint(1, 3);
      await nftMint(5);
      expect(
        await nftBurn(1, 3)().catch((ex) => {
          const m = ex.message.match(/irredeemable issue/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("burn-batch", async function () {
    it("should *not* burn NFTs (irredeemable issue)", async function () {
      for (let i = 0; i < 67; i++) await moeMint(15);
      await allowanceOf(1005);
      await nftMintBatch(1, 3);
      await nftMintBatch(5);
      expect(
        await nftBurnBatch(1, 3)().catch((ex) => {
          const m = ex.message.match(/irredeemable issue/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
});
async function allowanceOf(n, a = accounts[0]) {
  if (typeof n !== "bigint") n = BigInt(n);
  const tx = await moe.connect(a).increaseAllowance(nft.address, n * UNIT);
  expect(tx).to.be.an("object");
}
async function moeMint(n, a = accounts[0]) {
  const [nonce, block_hash] = tables[a.address].nextNonce({ amount: n });
  expect(nonce.gte(0)).to.eq(true);
  const tx = await moe.connect(a).mint(a.address, block_hash, nonce);
  expect(tx).to.be.an("object");
  return tx;
}
async function nftMint(n, l = 0, a = accounts[0]) {
  const year = (await nft.year()).toNumber();
  expect(year).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(a.address);
  const tx = await nft.connect(a).mint(a.address, l, n);
  const new_balance = await moe.balanceOf(a.address);
  expect(old_balance.sub(new_balance)).to.eq(BigInt(n * 10 ** l) * UNIT);
  const nft_id = (await nft.idBy(year, l)).toNumber();
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await nft.balanceOf(a.address, nft_id);
  expect(nft_balance.toNumber()).to.eq(n);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply.toNumber()).to.eq(n);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_XPOW_URL);
  return tx;
}
function nftBurn(n, l = 0, a = accounts[0]) {
  return async (dy = 0) => {
    const year = (await nft.year()).add(dy);
    expect(year.toNumber()).to.be.greaterThan(0);
    const nft_id = await nft.idBy(year, l);
    expect(nft_id.toNumber()).to.be.greaterThan(0);
    const old_balance = await moe.balanceOf(a.address);
    const tx = await nft.connect(a).burn(a.address, nft_id, n);
    const new_balance = await moe.balanceOf(a.address);
    expect(old_balance.add(new_balance)).to.eq(BigInt(n) * UNIT);
    const nft_balance = await nft.balanceOf(a.address, nft_id);
    expect(nft_balance).to.eq(0);
    const nft_supply = await nft.totalSupply(nft_id);
    expect(nft_supply).to.eq(0);
    const nft_exists = await nft.exists(nft_id);
    expect(nft_exists).to.eq(false);
    return tx;
  };
}
async function nftMintBatch(n, l = 0, a = accounts[0]) {
  const year = await nft.year();
  expect(year.toNumber()).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(a.address);
  const tx = await nft.connect(a).mintBatch(a.address, [l], [n]);
  const new_balance = await moe.balanceOf(a.address);
  expect(old_balance.sub(new_balance)).to.eq(BigInt(n * 10 ** l) * UNIT);
  const nft_ids = await nft.idsBy(year, [l]);
  expect(nft_ids.length).to.be.greaterThan(0);
  const nft_id = nft_ids[0].toNumber();
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await nft.balanceOf(a.address, nft_id);
  expect(nft_balance.toNumber()).to.eq(n);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply.toNumber()).to.eq(n);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_XPOW_URL);
  return tx;
}
function nftBurnBatch(n, l = 0, a = accounts[0]) {
  return async (dy = 0) => {
    const year = (await nft.year()).add(dy);
    expect(year.toNumber()).to.be.greaterThan(0);
    const nft_id = await nft.idBy(year, l);
    expect(nft_id.toNumber()).to.be.greaterThan(0);
    const old_balance = await moe.balanceOf(a.address);
    const tx = await nft.connect(a).burnBatch(a.address, [nft_id], [n]);
    const new_balance = await moe.balanceOf(a.address);
    expect(old_balance.add(new_balance)).to.eq(BigInt(n) * UNIT);
    const nft_balance = await nft.balanceOf(a.address, nft_id);
    expect(nft_balance).to.eq(0);
    const nft_supply = await nft.totalSupply(nft_id);
    expect(nft_supply).to.eq(0);
    const nft_exists = await nft.exists(nft_id);
    expect(nft_exists).to.eq(false);
    return tx;
  };
}
