/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower, XPowerNft; // contracts
let xpower, xpower_nft; // instances

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const NONE_ADDRESS = "0x0000000000000000000000000000000000000000";
const NFT_AQCH_WWW = "https://www.xpowermine.com/nfts/aqch/{id}.json";
const NFT_AQCH_URL = "https://xpowermine.com/nfts/aqch/{id}.json";
const DEADLINE = 0; // [seconds]

let UNIT, KILO, MEGA;
let GIGA, TERA, PETA;
let EXA, ZETTA, YOTTA;

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
    const factory = await ethers.getContractFactory("XPowerAqchTest");
    const contract = await factory.deploy(NONE_ADDRESS, DEADLINE);
    table = await new HashTable(contract, addresses[0]).init();
  });
  before(async function () {
    XPowerNft = await ethers.getContractFactory("XPowerAqchNft");
    expect(XPowerNft).to.exist;
    XPower = await ethers.getContractFactory("XPowerAqch");
    expect(XPower).to.exist;
  });
  beforeEach(async function () {
    xpower = await XPower.deploy(NONE_ADDRESS, DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
    await xpower.transferOwnership(addresses[1]);
    await xpower.init();
  });
  beforeEach(async function () {
    xpower_nft = await XPowerNft.deploy(
      NFT_AQCH_URL,
      NONE_ADDRESS,
      DEADLINE,
      xpower.address
    );
    expect(xpower_nft).to.exist;
    await xpower_nft.deployed();
  });
  beforeEach(async function () {
    UNIT = (await xpower_nft.UNIT()).toNumber();
    expect(UNIT).to.be.a("number").and.to.eq(0);
    KILO = (await xpower_nft.KILO()).toNumber();
    expect(KILO).to.be.a("number").and.to.eq(3);
    MEGA = (await xpower_nft.MEGA()).toNumber();
    expect(MEGA).to.be.a("number").and.to.eq(6);
    GIGA = (await xpower_nft.GIGA()).toNumber();
    expect(GIGA).to.be.a("number").and.to.eq(9);
    TERA = (await xpower_nft.TERA()).toNumber();
    expect(TERA).to.be.a("number").and.to.eq(12);
    PETA = (await xpower_nft.PETA()).toNumber();
    expect(PETA).to.be.a("number").and.to.eq(15);
    EXA = (await xpower_nft.EXA()).toNumber();
    expect(EXA).to.be.a("number").and.to.eq(18);
    ZETTA = (await xpower_nft.ZETTA()).toNumber();
    expect(ZETTA).to.be.a("number").and.to.eq(21);
    YOTTA = (await xpower_nft.YOTTA()).toNumber();
    expect(YOTTA).to.be.a("number").and.to.eq(24);
  });
  after(async function () {
    const [owner, signer_1] = await ethers.getSigners();
    await xpower.connect(signer_1).transferOwnership(owner.address);
  });
  describe("mint", async function () {
    it("should mint XPower for amount=3", async function () {
      await mintXPow(3);
    });
    it("should increase XPower allowance by amount=3", async function () {
      await increaseAllowanceBy(3);
    });
    it("should mint NFTs for level=UNIT & amount=3", async function () {
      await mintXPow(3);
      await increaseAllowanceBy(3);
      await mintXPowNft(UNIT, 3);
    });
    it("should *not* mint NFTs (non-ternary level)", async function () {
      expect(
        await mintXPowNft(2, 3).catch((ex) => {
          const m = ex.message.match(/non-ternary level/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* mint NFTs (non-positive amount)", async function () {
      expect(
        await mintXPowNft(UNIT, 0).catch((ex) => {
          const m = ex.message.match(/non-positive amount/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* mint NFTs (burn amount exceeds balance)", async function () {
      await increaseAllowanceBy(3);
      expect(
        await mintXPowNft(UNIT, 3).catch((ex) => {
          const m = ex.message.match(/burn amount exceeds balance/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* mint NFTs (insufficient allowance)", async function () {
      expect(
        await mintXPowNft(UNIT, 3).catch((ex) => {
          const m = ex.message.match(/insufficient allowance/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("mint-batch", async function () {
    it("should mint XPower for amount=1", async function () {
      await mintXPow(3);
    });
    it("should increase XPower allowance by amount=1", async function () {
      await increaseAllowanceBy(3);
    });
    it("should mint-batch NFTs for level=UNIT & amount=1", async function () {
      await mintXPow(3);
      await increaseAllowanceBy(3);
      await mintBatchXPowNft(UNIT, 3);
    });
    it("should *not* mint-batch NFTs (non-ternary level[0])", async function () {
      expect(
        await mintBatchXPowNft(2, 3).catch((ex) => {
          const m = ex.message.match(/non-ternary level/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* mint-batch NFTs (non-positive amount[0])", async function () {
      expect(
        await mintBatchXPowNft(UNIT, 0).catch((ex) => {
          const m = ex.message.match(/non-positive amount/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* mint-batch NFTs (burn amount exceeds balance)", async function () {
      await increaseAllowanceBy(3);
      expect(
        await mintBatchXPowNft(UNIT, 3).catch((ex) => {
          const m = ex.message.match(/burn amount exceeds balance/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* mint-batch NFTs (insufficient allowance)", async function () {
      expect(
        await mintBatchXPowNft(UNIT, 3).catch((ex) => {
          const m = ex.message.match(/insufficient allowance/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("setURI", async function () {
    it("should set new URI", async function () {
      const nft_year = (await xpower_nft.year()).toNumber();
      expect(nft_year).to.be.greaterThan(0);
      const nft_id = (await xpower_nft.idBy(nft_year, UNIT)).toNumber();
      expect(nft_id).to.be.greaterThan(0);
      await xpower_nft.setURI(NFT_AQCH_WWW);
      const nft_url = await xpower_nft.uri(nft_id);
      expect(nft_url).to.eq(NFT_AQCH_WWW);
    });
    it("should *not* set new URI (caller is not the owner)", async function () {
      const nft_year = (await xpower_nft.year()).toNumber();
      expect(nft_year).to.be.greaterThan(0);
      const nft_id = (await xpower_nft.idBy(nft_year, UNIT)).toNumber();
      expect(nft_id).to.be.greaterThan(0);
      await xpower_nft.transferOwnership(addresses[1]);
      expect(
        await xpower_nft.setURI(NFT_AQCH_WWW).catch((ex) => {
          const m = ex.message.match(/caller is not the owner/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
});
async function increaseAllowanceBy(amount) {
  const [owner, spender] = [addresses[0], xpower_nft.address];
  const increase = await xpower.increaseAllowance(spender, amount);
  expect(increase).to.be.an("object");
  const allowance = await xpower.allowance(owner, spender);
  expect(allowance.toNumber()).to.eq(amount);
}
async function mintXPow(amount) {
  const [nonce, block_hash] = table.getNonce({ amount });
  expect(nonce.gte(0)).to.eq(true);
  const tx = await xpower.mint(addresses[0], block_hash, nonce);
  expect(tx).to.be.an("object");
  expect(await xpower.balanceOf(addresses[0])).to.eq(amount);
  expect(await xpower.balanceOf(addresses[1])).to.eq(Math.floor(amount / 2));
}
async function mintXPowNft(unit, amount) {
  const year = (await xpower_nft.year()).toNumber();
  expect(year).to.be.greaterThan(0);
  await xpower_nft.mint(addresses[0], unit, amount);
  const nft_id = (await xpower_nft.idBy(year, unit)).toNumber();
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await xpower_nft.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(amount);
  const nft_supply = (await xpower_nft.totalSupply(nft_id)).toNumber();
  expect(nft_supply).to.eq(amount);
  const nft_exists = await xpower_nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await xpower_nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_AQCH_URL);
}
async function mintBatchXPowNft(unit, amount) {
  const year = (await xpower_nft.year()).toNumber();
  expect(year).to.be.greaterThan(0);
  await xpower_nft.mintBatch(addresses[0], [unit], [amount]);
  const nft_ids = await xpower_nft.idsBy(year, [unit]);
  expect(nft_ids.length).to.be.greaterThan(0);
  const nft_id = nft_ids[0].toNumber();
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await xpower_nft.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(amount);
  const nft_supply = (await xpower_nft.totalSupply(nft_id)).toNumber();
  expect(nft_supply).to.eq(amount);
  const nft_exists = await xpower_nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await xpower_nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_AQCH_URL);
}
