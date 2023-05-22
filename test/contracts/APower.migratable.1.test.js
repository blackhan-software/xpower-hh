/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let AThorOld, AThorNew; // contracts
let XThorOld, XThorNew; // contracts
let ALokiOld, ALokiNew; // contracts
let XLokiOld, XLokiNew; // contracts
let AOdinOld, AOdinNew; // contracts
let XOdinOld, XOdinNew; // contracts
let athor_old, athor_new; // instances
let xthor_old, xthor_new; // instances
let aloki_old, aloki_new; // instances
let xloki_old, xloki_new; // instances
let aodin_old, aodin_new; // instances
let xodin_old, xodin_new; // instances
let UNIT_OLD, UNIT_NEW; // decimals
let DECI_OLD, DECI_NEW; // 10 units

const DEADLINE = 126_230_400; // [seconds] i.e. 4 years

describe("APower Migration", async function () {
  beforeEach(async function () {
    await network.provider.send("hardhat_reset");
  });
  beforeEach(async function () {
    AThorOld = await ethers.getContractFactory("APowerThorOldTest");
    AThorNew = await ethers.getContractFactory("APowerThorTest");
    XThorOld = await ethers.getContractFactory("XPowerThorOldTest");
    XThorNew = await ethers.getContractFactory("XPowerThorTest");
    ALokiOld = await ethers.getContractFactory("APowerLokiOldTest");
    ALokiNew = await ethers.getContractFactory("APowerLokiTest");
    XLokiOld = await ethers.getContractFactory("XPowerLokiOldTest");
    XLokiNew = await ethers.getContractFactory("XPowerLokiTest");
    AOdinOld = await ethers.getContractFactory("APowerOdinOldTest");
    AOdinNew = await ethers.getContractFactory("APowerOdinTest");
    XOdinOld = await ethers.getContractFactory("XPowerOdinOldTest");
    XOdinNew = await ethers.getContractFactory("XPowerOdinTest");
  });
  beforeEach(async function () {
    // deploy old apower contract:
    xthor_old = await XThorOld.deploy([], DEADLINE);
    expect(xthor_old).to.exist;
    await xthor_old.deployed();
    await xthor_old.init();
    xloki_old = await XLokiOld.deploy([], DEADLINE);
    expect(xloki_old).to.exist;
    await xloki_old.deployed();
    await xloki_old.init();
    xodin_old = await XOdinOld.deploy([], DEADLINE);
    expect(xodin_old).to.exist;
    await xodin_old.deployed();
    await xodin_old.init();
    // deploy new apower contract:
    xthor_new = await XThorNew.deploy([xthor_old.address], DEADLINE);
    expect(xthor_new).to.exist;
    await xthor_new.deployed();
    await xthor_new.init();
    xloki_new = await XLokiNew.deploy([xloki_old.address], DEADLINE);
    expect(xloki_new).to.exist;
    await xloki_new.deployed();
    await xloki_new.init();
    xodin_new = await XOdinNew.deploy([xodin_old.address], DEADLINE);
    expect(xodin_new).to.exist;
    await xodin_new.deployed();
    await xodin_new.init();
  });
  beforeEach(async function () {
    const decimals = await xodin_old.decimals();
    expect(decimals).to.eq(0);
    UNIT_OLD = 10n ** BigInt(decimals);
    expect(UNIT_OLD >= 1n).to.be.true;
    DECI_OLD = 10n * UNIT_OLD;
  });
  beforeEach(async function () {
    const decimals = await xodin_new.decimals();
    expect(decimals).to.eq(18);
    UNIT_NEW = 10n ** BigInt(decimals);
    expect(UNIT_NEW >= 1n).to.be.true;
    DECI_NEW = 10n * UNIT_NEW;
  });
  beforeEach(async function () {
    // deploy old apower contracts:
    athor_old = await AThorOld.deploy(xthor_old.address, [], DEADLINE);
    expect(athor_old).to.exist;
    await athor_old.deployed();
    aloki_old = await ALokiOld.deploy(xloki_old.address, [], DEADLINE);
    expect(aloki_old).to.exist;
    await aloki_old.deployed();
    aodin_old = await AOdinOld.deploy(xodin_old.address, [], DEADLINE);
    expect(aodin_old).to.exist;
    await aodin_old.deployed();
    // deploy new apower contracts:
    athor_new = await AThorNew.deploy(
      xthor_new.address,
      [athor_old.address],
      DEADLINE
    );
    expect(athor_new).to.exist;
    await athor_new.deployed();
    aloki_new = await ALokiNew.deploy(
      xloki_new.address,
      [aloki_old.address],
      DEADLINE
    );
    expect(aloki_new).to.exist;
    await aloki_new.deployed();
    aodin_new = await AOdinNew.deploy(
      xodin_new.address,
      [aodin_old.address],
      DEADLINE
    );
    expect(aodin_new).to.exist;
    await aodin_new.deployed();
  });
  describe("XPowerOld.decimals", async function () {
    it("should return old.decimals=0", async function () {
      const decimals_thor = await xthor_old.decimals();
      expect(decimals_thor).to.eq(0);
      const decimals_loki = await xloki_old.decimals();
      expect(decimals_loki).to.eq(0);
      const decimals_odin = await xodin_old.decimals();
      expect(decimals_odin).to.eq(0);
    });
  });
  describe("XPowerNew.decimals", async function () {
    it("should return new.decimals=18", async function () {
      const decimals_thor = await xthor_new.decimals();
      expect(decimals_thor).to.eq(18);
      const decimals_loki = await xloki_new.decimals();
      expect(decimals_loki).to.eq(18);
      const decimals_odin = await xodin_new.decimals();
      expect(decimals_odin).to.eq(18);
    });
  });
  describe("APowerOld.decimals", async function () {
    it("should return old.decimals=0", async function () {
      const decimals_thor = await athor_old.decimals();
      expect(decimals_thor).to.eq(0);
      const decimals_loki = await aloki_old.decimals();
      expect(decimals_loki).to.eq(0);
      const decimals_odin = await aodin_old.decimals();
      expect(decimals_odin).to.eq(0);
    });
  });
  describe("APowerNew.decimals", async function () {
    it("should return new.decimals=18", async function () {
      const decimals_thor = await athor_new.decimals();
      expect(decimals_thor).to.eq(18);
      const decimals_loki = await aloki_new.decimals();
      expect(decimals_loki).to.eq(18);
      const decimals_odin = await aodin_new.decimals();
      expect(decimals_odin).to.eq(18);
    });
  });
  describe("newUnits", async function () {
    it("should convert old moe-amount => new moe-amount", async function () {
      expect(await xodin_new.newUnits(UNIT_OLD, 0)).to.eq(UNIT_NEW);
      expect(await xodin_new.newUnits(DECI_OLD, 0)).to.eq(DECI_NEW);
    });
    it("should convert old sov-amount => new sov-amount", async function () {
      expect(await aodin_new.newUnits(UNIT_OLD, 0)).to.eq(UNIT_NEW);
      expect(await aodin_new.newUnits(DECI_OLD, 0)).to.eq(DECI_NEW);
    });
  });
  describe("oldUnits", async function () {
    it("should convert new moe-amount => old moe-amount", async function () {
      expect(await xodin_new.oldUnits(UNIT_NEW, 0)).to.eq(UNIT_OLD);
      expect(await xodin_new.oldUnits(DECI_NEW, 0)).to.eq(DECI_OLD);
    });
    it("should convert new sov-amount => old sov-amount", async function () {
      expect(await aodin_new.oldUnits(UNIT_NEW, 0)).to.eq(UNIT_OLD);
      expect(await aodin_new.oldUnits(DECI_NEW, 0)).to.eq(DECI_OLD);
    });
  });
  describe("moeUnits", async function () {
    it("should convert old sov-amount => moe-units", async function () {
      expect(await aodin_old.moeUnits(UNIT_OLD)).to.eq(UNIT_OLD);
      expect(await aodin_old.moeUnits(DECI_OLD)).to.eq(DECI_OLD);
    });
    it("should convert new sov-amount => moe-units", async function () {
      expect(await aodin_new.moeUnits(UNIT_NEW)).to.eq(UNIT_NEW);
      expect(await aodin_new.moeUnits(DECI_NEW)).to.eq(DECI_NEW);
    });
  });
  describe("sovUnits", async function () {
    it("should convert old moe-amount => sov-units", async function () {
      expect(await aodin_old.sovUnits(UNIT_OLD)).to.eq(UNIT_OLD);
      expect(await aodin_old.sovUnits(DECI_OLD)).to.eq(DECI_OLD);
    });
    it("should convert new moe-amount => sov-units", async function () {
      expect(await aodin_new.sovUnits(UNIT_NEW)).to.eq(UNIT_NEW);
      expect(await aodin_new.sovUnits(DECI_NEW)).to.eq(DECI_NEW);
    });
  });
});
