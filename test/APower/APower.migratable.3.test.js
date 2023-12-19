const { ethers } = require("hardhat");
const { expect } = require("chai");

let MoeOld, MoeNew; // contract
let SovOld, SovNew; // contract
let moe_old, moe_new; // instance
let sov_old, sov_new; // instance

let MOE_UNIT_OLD, MOE_UNIT_NEW; // decimals
let SOV_UNIT_OLD, SOV_UNIT_NEW; // decimals

const DEADLINE = 126_230_400; // [seconds] i.e. 4 years

describe("APower Migration", async function () {
  beforeEach(async function () {
    SovOld = await ethers.getContractFactory("APowerOldTest36");
    SovNew = await ethers.getContractFactory("APowerNewTest");
    MoeOld = await ethers.getContractFactory("XPowerOldTest36");
    MoeNew = await ethers.getContractFactory("XPowerOldTest");
  });
  beforeEach(async function () {
    // deploy old apower contract:
    moe_old = await MoeOld.deploy([], DEADLINE);
    expect(moe_old).to.be.an("object");
    await moe_old.init();
    // deploy new apower contract:
    moe_new = await MoeNew.deploy([moe_old.target], DEADLINE);
    expect(moe_new).to.be.an("object");
    await moe_new.init();
  });
  beforeEach(async function () {
    const decimals = await moe_old.decimals();
    expect(decimals).to.eq(36);
    MOE_UNIT_OLD = 10n ** BigInt(decimals);
    expect(MOE_UNIT_OLD >= 1n).to.eq(true);
  });
  beforeEach(async function () {
    const decimals = await moe_new.decimals();
    expect(decimals).to.eq(0);
    MOE_UNIT_NEW = 10n ** BigInt(decimals);
    expect(MOE_UNIT_NEW >= 1n).to.eq(true);
  });
  beforeEach(async function () {
    // deploy old apower contracts:
    sov_old = await SovOld.deploy(moe_old.target, [], DEADLINE);
    expect(sov_old).to.be.an("object");
    // deploy new apower contracts:
    sov_new = await SovNew.deploy(moe_new.target, [sov_old.target], DEADLINE);
    expect(sov_new).to.be.an("object");
  });
  beforeEach(async function () {
    const decimals = await sov_old.decimals();
    expect(decimals).to.eq(36);
    SOV_UNIT_OLD = 10n ** BigInt(decimals);
    expect(SOV_UNIT_OLD >= 1n).to.eq(true);
  });
  beforeEach(async function () {
    const decimals = await sov_new.decimals();
    expect(decimals).to.eq(18);
    SOV_UNIT_NEW = 10n ** BigInt(decimals);
    expect(SOV_UNIT_NEW >= 1n).to.eq(true);
  });
  describe("XPowerOld.decimals", async function () {
    it("should return old.decimals=36", async function () {
      const decimals = await moe_old.decimals();
      expect(decimals).to.eq(36);
    });
  });
  describe("XPowerNew.decimals", async function () {
    it("should return new.decimals=0", async function () {
      const decimals = await moe_new.decimals();
      expect(decimals).to.eq(0);
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
      expect(await moe_new.newUnits(MOE_UNIT_OLD, 0)).to.eq(MOE_UNIT_NEW);
      expect(await moe_new.newUnits(33n * MOE_UNIT_OLD, 0)).to.eq(
        33n * MOE_UNIT_NEW,
      );
    });
    it("should convert old sov-amount => new sov-amount", async function () {
      expect(await sov_new.newUnits(SOV_UNIT_OLD, 0)).to.eq(SOV_UNIT_NEW);
      expect(await sov_new.newUnits(33n * SOV_UNIT_OLD, 0)).to.eq(
        33n * SOV_UNIT_NEW,
      );
    });
  });
  describe("oldUnits", async function () {
    it("should convert new moe-amount => old moe-amount", async function () {
      expect(await moe_new.oldUnits(MOE_UNIT_NEW, 0)).to.eq(MOE_UNIT_OLD);
      expect(await moe_new.oldUnits(33n * MOE_UNIT_NEW, 0)).to.eq(
        33n * MOE_UNIT_OLD,
      );
    });
    it("should convert new sov-amount => old sov-amount", async function () {
      expect(await sov_new.oldUnits(SOV_UNIT_NEW, 0)).to.eq(SOV_UNIT_OLD);
      expect(await sov_new.oldUnits(33n * SOV_UNIT_NEW, 0)).to.eq(
        33n * SOV_UNIT_OLD,
      );
    });
  });
  describe("moeUnits", async function () {
    it("should convert old sov-amount => old moe-units", async function () {
      expect(await sov_old.moeUnits(MOE_UNIT_OLD)).to.eq(MOE_UNIT_OLD);
      expect(await sov_old.moeUnits(33n * MOE_UNIT_OLD)).to.eq(
        33n * MOE_UNIT_OLD,
      );
    });
    it("should convert new sov-amount => new moe-units", async function () {
      expect(await sov_new.moeUnits(SOV_UNIT_NEW)).to.eq(MOE_UNIT_NEW);
      expect(await sov_new.moeUnits(33n * SOV_UNIT_NEW)).to.eq(
        33n * MOE_UNIT_NEW,
      );
    });
  });
  describe("sovUnits", async function () {
    it("should convert old moe-amount => old sov-units", async function () {
      expect(await sov_old.sovUnits(MOE_UNIT_OLD)).to.eq(MOE_UNIT_OLD);
      expect(await sov_old.sovUnits(33n * MOE_UNIT_OLD)).to.eq(
        33n * MOE_UNIT_OLD,
      );
    });
    it("should convert new moe-amount => new sov-units", async function () {
      expect(await sov_new.sovUnits(MOE_UNIT_NEW)).to.eq(SOV_UNIT_NEW);
      expect(await sov_new.sovUnits(33n * MOE_UNIT_NEW)).to.eq(
        33n * SOV_UNIT_NEW,
      );
    });
  });
});
