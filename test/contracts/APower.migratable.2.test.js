/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let MoeOld, MoeNew; // contracts
let SovOld, SovNew; // contracts
let moe_old, moe_new; // instances
let sov_old, sov_new; // instances
let UNIT_OLD, UNIT_NEW; // decimals
let DECI_OLD, DECI_NEW; // 10 units

const DEADLINE = 126_230_400; // [seconds] i.e. 4 years

describe("APower Migration", async function () {
  beforeEach(async function () {
    await network.provider.send("hardhat_reset");
  });
  beforeEach(async function () {
    SovOld = await ethers.getContractFactory("APowerOldTest36");
    SovNew = await ethers.getContractFactory("APowerTest");
    MoeOld = await ethers.getContractFactory("XPowerOldTest36");
    MoeNew = await ethers.getContractFactory("XPowerTest");
  });
  beforeEach(async function () {
    // deploy old apower contract:
    moe_old = await MoeOld.deploy([], DEADLINE);
    expect(moe_old).to.exist;
    await moe_old.deployed();
    await moe_old.init();
    // deploy new apower contract:
    moe_new = await MoeNew.deploy([moe_old.address], DEADLINE);
    expect(moe_new).to.exist;
    await moe_new.deployed();
    await moe_new.init();
  });
  beforeEach(async function () {
    const decimals = await moe_old.decimals();
    expect(decimals).to.eq(36);
    UNIT_OLD = 10n ** BigInt(decimals);
    expect(UNIT_OLD >= 1n).to.be.true;
    DECI_OLD = 10n * UNIT_OLD;
  });
  beforeEach(async function () {
    const decimals = await moe_new.decimals();
    expect(decimals).to.eq(18);
    UNIT_NEW = 10n ** BigInt(decimals);
    expect(UNIT_NEW >= 1n).to.be.true;
    DECI_NEW = 10n * UNIT_NEW;
  });
  beforeEach(async function () {
    // deploy old apower contracts:
    sov_old = await SovOld.deploy(moe_old.address, [], DEADLINE);
    expect(sov_old).to.exist;
    await sov_old.deployed();
    // deploy new apower contracts:
    sov_new = await SovNew.deploy(moe_new.address, [sov_old.address], DEADLINE);
    expect(sov_new).to.exist;
    await sov_new.deployed();
  });
  describe("XPowerOld.decimals", async function () {
    it("should return old.decimals=36", async function () {
      const decimals = await moe_old.decimals();
      expect(decimals).to.eq(36);
    });
  });
  describe("XPowerNew.decimals", async function () {
    it("should return new.decimals=18", async function () {
      const decimals = await moe_new.decimals();
      expect(decimals).to.eq(18);
    });
  });
  describe("APowerOld.decimals", async function () {
    it("should return old.decimals=36", async function () {
      const decimals = await sov_old.decimals();
      expect(decimals).to.eq(36);
    });
  });
  describe("APowerNew.decimals", async function () {
    it("should return new.decimals=18", async function () {
      const decimals = await sov_new.decimals();
      expect(decimals).to.eq(18);
    });
  });
  describe("newUnits", async function () {
    it("should convert old moe-amount => new moe-amount", async function () {
      expect(await moe_new.newUnits(UNIT_OLD, 0)).to.eq(UNIT_NEW);
      expect(await moe_new.newUnits(DECI_OLD, 0)).to.eq(DECI_NEW);
    });
    it("should convert old sov-amount => new sov-amount", async function () {
      expect(await sov_new.newUnits(UNIT_OLD, 0)).to.eq(UNIT_NEW);
      expect(await sov_new.newUnits(DECI_OLD, 0)).to.eq(DECI_NEW);
    });
  });
  describe("oldUnits", async function () {
    it("should convert new moe-amount => old moe-amount", async function () {
      expect(await moe_new.oldUnits(UNIT_NEW, 0)).to.eq(UNIT_OLD);
      expect(await moe_new.oldUnits(DECI_NEW, 0)).to.eq(DECI_OLD);
    });
    it("should convert new sov-amount => old sov-amount", async function () {
      expect(await sov_new.oldUnits(UNIT_NEW, 0)).to.eq(UNIT_OLD);
      expect(await sov_new.oldUnits(DECI_NEW, 0)).to.eq(DECI_OLD);
    });
  });
  describe("moeUnits", async function () {
    it("should convert old sov-amount => old moe-units", async function () {
      expect(await sov_old.moeUnits(UNIT_OLD)).to.eq(UNIT_OLD);
      expect(await sov_old.moeUnits(DECI_OLD)).to.eq(DECI_OLD);
    });
    it("should convert new sov-amount => new moe-units", async function () {
      expect(await sov_new.moeUnits(UNIT_NEW)).to.eq(UNIT_NEW);
      expect(await sov_new.moeUnits(DECI_NEW)).to.eq(DECI_NEW);
    });
  });
  describe("sovUnits", async function () {
    it("should convert old moe-amount => old sov-units", async function () {
      expect(await sov_old.sovUnits(UNIT_OLD)).to.eq(UNIT_OLD);
      expect(await sov_old.sovUnits(DECI_OLD)).to.eq(DECI_OLD);
    });
    it("should convert new moe-amount => new sov-units", async function () {
      expect(await sov_new.sovUnits(UNIT_NEW)).to.eq(UNIT_NEW);
      expect(await sov_new.sovUnits(DECI_NEW)).to.eq(DECI_NEW);
    });
  });
});
