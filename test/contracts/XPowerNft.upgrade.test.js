/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower, XPowerNft; // contracts
let xpower, xpower_nft; // instances
let UNUM; // decimals

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const NFT_ODIN_URL = "https://xpowermine.com/nfts/odin/{id}.json";
const DEADLINE = 0; // [seconds]
let UNIT, KILO;

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
    XPowerNft = await ethers.getContractFactory("XPowerNft");
    expect(XPowerNft).to.exist;
    XPower = await ethers.getContractFactory("XPowerOdin");
    expect(XPower).to.exist;
  });
  beforeEach(async function () {
    xpower = await XPower.deploy([], DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
    await xpower.transferOwnership(addresses[1]);
    await xpower.init();
  });
  beforeEach(async function () {
    table = await new HashTable(xpower, addresses[0]).init({
      length: 1n,
      min_level: 3,
      max_level: 3,
    });
  });
  beforeEach(async function () {
    const decimals = await xpower.decimals();
    expect(decimals).to.greaterThan(0);
    UNUM = 10n ** BigInt(decimals);
    expect(UNUM >= 1n).to.be.true;
  });
  beforeEach(async function () {
    xpower_nft = await XPowerNft.deploy(
      NFT_ODIN_URL,
      [xpower.address],
      [],
      DEADLINE
    );
    expect(xpower_nft).to.exist;
    await xpower_nft.deployed();
  });
  beforeEach(async function () {
    UNIT = (await xpower_nft.UNIT()).toNumber();
    expect(UNIT).to.be.a("number").and.to.eq(0);
    KILO = (await xpower_nft.KILO()).toNumber();
    expect(KILO).to.be.a("number").and.to.eq(3);
  });
  after(async function () {
    const [owner, signer_1] = await ethers.getSigners();
    await xpower.connect(signer_1).transferOwnership(owner.address);
  });
  describe("upgrade", async function () {
    it("should *not* upgrade NFTs (non-positive level)", async function () {
      const tx = await upgradeXPowNft(UNIT, 1).catch((ex) => {
        const m = ex.message.match(/non-positive level/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(tx).to.eq(undefined);
    });
    it("should *not* upgrade NFTs (non-ternary level)", async function () {
      const tx = await upgradeXPowNft(KILO - 2, 1).catch((ex) => {
        const m = ex.message.match(/non-ternary level/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(tx).to.eq(undefined);
    });
    it("should *not* upgrade NFTs (non-positive amount)", async function () {
      const tx = await upgradeXPowNft(KILO, 0).catch((ex) => {
        const m = ex.message.match(/non-positive amount/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(tx).to.eq(undefined);
    });
    it("should *not* upgrade NFTs (burn amount exceeds total-supply)", async function () {
      const tx = await upgradeXPowNft(KILO, 1).catch((ex) => {
        const m = ex.message.match(/burn amount exceeds totalSupply/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(tx).to.eq(undefined);
    });
    it("should upgrade NFTs for level=KILO & amount=1", async function () {
      await mintXPow(4095);
      await increaseAllowanceBy(4095);
      await mintXPowNft(UNIT, 4095);
      await upgradeXPowNft(KILO, 1);
    });
  });
  describe("upgradeBatch", async function () {
    it("should *not* upgrade NFTs (non-positive level)", async function () {
      const tx = await upgradeBatchXPowNft(UNIT, 1).catch((ex) => {
        const m = ex.message.match(/non-positive level/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(tx).to.eq(undefined);
    });
    it("should *not* upgrade NFTs (non-ternary level)", async function () {
      const tx = await upgradeBatchXPowNft(KILO - 2, 1).catch((ex) => {
        const m = ex.message.match(/non-ternary level/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(tx).to.eq(undefined);
    });
    it("should *not* upgrade NFTs (non-positive amount)", async function () {
      const tx = await upgradeBatchXPowNft(KILO, 0).catch((ex) => {
        const m = ex.message.match(/non-positive amount/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(tx).to.eq(undefined);
    });
    it("should *not* upgrade NFTs (burn amount exceeds total-supply)", async function () {
      const tx = await upgradeBatchXPowNft(KILO, 1).catch((ex) => {
        const m = ex.message.match(/burn amount exceeds totalSupply/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(tx).to.eq(undefined);
    });
    it("should upgrade NFTs for level=KILO & amount=1", async function () {
      await mintXPow(4095);
      await increaseAllowanceBy(4095);
      await mintBatchXPowNft(UNIT, 4095);
      await upgradeBatchXPowNft(KILO, 1);
    });
  });
});
async function increaseAllowanceBy(amount) {
  const [owner, spender] = [addresses[0], xpower_nft.address];
  const increase = await xpower.increaseAllowance(
    spender,
    BigInt(amount) * UNUM
  );
  expect(increase).to.be.an("object");
  const allowance = await xpower.allowance(owner, spender);
  expect(allowance).to.eq(BigInt(amount) * UNUM);
}
async function mintXPow(amount) {
  const [nonce, block_hash] = table.getNonce({ amount });
  expect(nonce.gte(0)).to.eq(true);
  const tx = await xpower.mint(addresses[0], block_hash, nonce);
  expect(tx).to.be.an("object");
  expect(await xpower.balanceOf(addresses[0])).to.eq(BigInt(amount) * UNUM);
  expect(await xpower.balanceOf(addresses[1])).to.eq(
    (BigInt(amount) * UNUM) / 2n
  );
}
async function mintXPowNft(unit, amount) {
  const year = (await xpower_nft.year()).toNumber();
  expect(year).to.be.greaterThan(0);
  const old_balance = await xpower.balanceOf(addresses[0]);
  const moe_index = await xpower_nft.moeIndexOf(xpower.address);
  await xpower_nft.mint(addresses[0], unit, amount, moe_index);
  const new_balance = await xpower.balanceOf(addresses[0]);
  expect(old_balance.sub(new_balance)).to.eq(
    BigInt(amount) * 10n ** BigInt(unit) * UNUM
  );
  const moe_prefix = await xpower.prefix();
  const nft_id = (await xpower_nft.idBy(year, unit, moe_prefix)).toNumber();
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await xpower_nft.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(amount);
  const nft_supply = await xpower_nft.totalSupply(nft_id);
  expect(nft_supply).to.eq(amount);
  const nft_exists = await xpower_nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await xpower_nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_ODIN_URL);
}
async function upgradeXPowNft(unit, amount) {
  const year = (await xpower_nft.year()).toNumber();
  expect(year).to.be.greaterThan(0);
  const old_balance = await xpower.balanceOf(addresses[0]);
  const moe_index = await xpower_nft.moeIndexOf(xpower.address);
  await xpower_nft.upgrade(addresses[0], year, unit, amount, moe_index);
  const new_balance = await xpower.balanceOf(addresses[0]);
  expect(old_balance.sub(new_balance)).to.eq(0);
  const moe_prefix = await xpower.prefix();
  const nft_id = (await xpower_nft.idBy(year, unit, moe_prefix)).toNumber();
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await xpower_nft.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(amount);
  const nft_supply = await xpower_nft.totalSupply(nft_id);
  expect(nft_supply).to.eq(amount);
  const nft_exists = await xpower_nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await xpower_nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_ODIN_URL);
}
async function mintBatchXPowNft(unit, amount) {
  const year = (await xpower_nft.year()).toNumber();
  expect(year).to.be.greaterThan(0);
  const old_balance = await xpower.balanceOf(addresses[0]);
  const moe_index = await xpower_nft.moeIndexOf(xpower.address);
  await xpower_nft.mintBatch(addresses[0], [unit], [amount], moe_index);
  const new_balance = await xpower.balanceOf(addresses[0]);
  expect(old_balance.sub(new_balance)).to.eq(
    BigInt(amount) * 10n ** BigInt(unit) * UNUM
  );
  const moe_prefix = await xpower.prefix();
  const nft_ids = await xpower_nft.idsBy(year, [unit], moe_prefix);
  expect(nft_ids.length).to.be.greaterThan(0);
  const nft_id = nft_ids[0].toNumber();
  expect(nft_ids.length).to.equal(1);
  const nft_balance = await xpower_nft.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(amount);
  const nft_supply = (await xpower_nft.totalSupply(nft_id)).toNumber();
  expect(nft_supply).to.eq(amount);
  const nft_exists = await xpower_nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await xpower_nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_ODIN_URL);
}
async function upgradeBatchXPowNft(unit, amount) {
  const year = (await xpower_nft.year()).toNumber();
  expect(year).to.be.greaterThan(0);
  const old_balance = await xpower.balanceOf(addresses[0]);
  const moe_index = await xpower_nft.moeIndexOf(xpower.address);
  const [years, units, amounts] = [[year], [[unit]], [[amount]]];
  await xpower_nft.upgradeBatch(addresses[0], years, units, amounts, moe_index);
  const new_balance = await xpower.balanceOf(addresses[0]);
  expect(old_balance.sub(new_balance)).to.eq(0);
  const moe_prefix = await xpower.prefix();
  const nft_ids = await xpower_nft.idsBy(year, [unit], moe_prefix);
  expect(nft_ids.length).to.equal(1);
  const nft_id = nft_ids[0].toNumber();
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await xpower_nft.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(amount);
  const nft_supply = (await xpower_nft.totalSupply(nft_id)).toNumber();
  expect(nft_supply).to.eq(amount);
  const nft_exists = await xpower_nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await xpower_nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_ODIN_URL);
}
