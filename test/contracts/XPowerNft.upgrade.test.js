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
let table; // pre-hashed nonces

const NFT_ODIN_URL = "https://xpowermine.com/nfts/odin/{id}.json";
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
    Moe = await ethers.getContractFactory("XPowerOdin");
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
    table = await new HashTable(moe, addresses[0]).init({
      min_level: 3,
      max_level: 3,
    });
  });
  beforeEach(async function () {
    const decimals = await moe.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.be.true;
  });
  beforeEach(async function () {
    nft = await Nft.deploy(NFT_ODIN_URL, [moe.address], [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
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
        expect(m).to.be.not.null;
      });
      expect(tx).to.eq(undefined);
    });
    it("should *not* upgrade NFTs (burn amount exceeds total-supply)", async function () {
      const tx = await nftUpgrade(1, 3).catch((ex) => {
        const m = ex.message.match(/burn amount exceeds totalSupply/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(tx).to.eq(undefined);
    });
    it("should upgrade NFTs for level=KILO & amount=1", async function () {
      await moeMint(4095);
      await allowanceOf(4095);
      await nftMint(4095);
      await nftUpgrade(1, 3);
    });
  });
  describe("upgradeBatch", async function () {
    it("should *not* upgrade NFTs (non-ternary level)", async function () {
      const tx = await nftUpgradeBatch(1, 1).catch((ex) => {
        const m = ex.message.match(/non-ternary level/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(tx).to.eq(undefined);
    });
    it("should *not* upgrade NFTs (burn amount exceeds total-supply)", async function () {
      const tx = await nftUpgradeBatch(1, 3).catch((ex) => {
        const m = ex.message.match(/burn amount exceeds totalSupply/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(tx).to.eq(undefined);
    });
    it("should upgrade NFTs for level=KILO & amount=1", async function () {
      await moeMint(4095);
      await allowanceOf(4095);
      await nftMintBatch(4095);
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
  const [nonce, block_hash] = table.getNonce({ amount: n });
  expect(nonce.gte(0)).to.eq(true);
  const tx = await moe.mint(addresses[0], block_hash, nonce);
  expect(tx).to.be.an("object");
  expect(await moe.balanceOf(addresses[0])).to.eq(BigInt(n) * UNIT);
  expect(await moe.balanceOf(addresses[1])).to.eq((BigInt(n) * UNIT) / 2n);
}
async function nftMint(n, l = 0) {
  const year = await nft.year();
  expect(year.toNumber()).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(addresses[0]);
  const moe_index = await nft.moeIndexOf(moe.address);
  await nft.mint(addresses[0], l, n, moe_index);
  const new_balance = await moe.balanceOf(addresses[0]);
  expect(old_balance.sub(new_balance)).to.eq(
    BigInt(n) * 10n ** BigInt(l) * UNIT
  );
  const moe_prefix = await moe.prefix();
  const nft_id = await nft.idBy(year, l, moe_prefix);
  expect(nft_id.toNumber()).to.be.greaterThan(0);
  const nft_balance = await nft.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(n);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply).to.eq(n);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_ODIN_URL);
}
async function nftUpgrade(n, l = 0) {
  const year = (await nft.year()).toNumber();
  expect(year).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(addresses[0]);
  const moe_index = await nft.moeIndexOf(moe.address);
  await nft.upgrade(addresses[0], year, l, n, moe_index);
  const new_balance = await moe.balanceOf(addresses[0]);
  expect(old_balance.sub(new_balance)).to.eq(0);
  const moe_prefix = await moe.prefix();
  const nft_id = await nft.idBy(year, l, moe_prefix);
  expect(nft_id.toNumber()).to.be.greaterThan(0);
  const nft_balance = await nft.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(n);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply).to.eq(n);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_ODIN_URL);
}
async function nftMintBatch(n, l = 0) {
  const year = (await nft.year()).toNumber();
  expect(year).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(addresses[0]);
  const moe_index = await nft.moeIndexOf(moe.address);
  await nft.mintBatch(addresses[0], [l], [n], moe_index);
  const new_balance = await moe.balanceOf(addresses[0]);
  expect(old_balance.sub(new_balance)).to.eq(
    BigInt(n) * 10n ** BigInt(l) * UNIT
  );
  const moe_prefix = await moe.prefix();
  const nft_ids = await nft.idsBy(year, [l], moe_prefix);
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
  expect(nft_url).to.eq(NFT_ODIN_URL);
}
async function nftUpgradeBatch(n, l = 0) {
  const year = await nft.year();
  expect(year.toNumber()).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(addresses[0]);
  const moe_index = await nft.moeIndexOf(moe.address);
  const [years, units, amounts] = [[year], [[l]], [[n]]];
  await nft.upgradeBatch(addresses[0], years, units, amounts, moe_index);
  const new_balance = await moe.balanceOf(addresses[0]);
  expect(old_balance.sub(new_balance)).to.eq(0);
  const moe_prefix = await moe.prefix();
  const nft_ids = await nft.idsBy(year, [l], moe_prefix);
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
  expect(nft_url).to.eq(NFT_ODIN_URL);
}
