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

const NFT_LOKI_URL = "https://xpowermine.com/nfts/loki/{id}.json";
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
    XPowerNft = await ethers.getContractFactory("XPowerLokiNft");
    expect(XPowerNft).to.exist;
    XPower = await ethers.getContractFactory("XPowerLoki");
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
    table = await new HashTable(xpower, addresses[0]).init();
  });
  beforeEach(async function () {
    const decimals = await xpower.decimals();
    expect(decimals).to.greaterThan(0);
    UNUM = 10n ** BigInt(decimals);
    expect(UNUM >= 1n).to.be.true;
  });
  beforeEach(async function () {
    xpower_nft = await XPowerNft.deploy(
      NFT_LOKI_URL,
      xpower.address,
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
  await xpower_nft.mint(addresses[0], unit, amount);
  const new_balance = await xpower.balanceOf(addresses[0]);
  expect(old_balance.sub(new_balance)).to.eq(
    BigInt(amount) * 10n ** BigInt(unit) * UNUM
  );
  const nft_id = (await xpower_nft.idBy(year, unit)).toNumber();
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await xpower_nft.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(amount);
  const nft_supply = await xpower_nft.totalSupply(nft_id);
  expect(nft_supply).to.eq(amount);
  const nft_exists = await xpower_nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await xpower_nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_LOKI_URL);
}
async function mintBatchXPowNft(unit, amount) {
  const year = (await xpower_nft.year()).toNumber();
  expect(year).to.be.greaterThan(0);
  const old_balance = await xpower.balanceOf(addresses[0]);
  await xpower_nft.mintBatch(addresses[0], [unit], [amount]);
  const new_balance = await xpower.balanceOf(addresses[0]);
  expect(old_balance.sub(new_balance)).to.eq(
    BigInt(amount) * 10n ** BigInt(unit) * UNUM
  );
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
  expect(nft_url).to.eq(NFT_LOKI_URL);
}
