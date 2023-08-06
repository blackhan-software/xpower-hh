/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let Integrator; // contracts
let integrator; // instances

const DAYS = 24 * 3600;
const CENTURY = 365_25 * DAYS;
const YEAR = CENTURY / 100;
const MONTH = YEAR / 12;

const M0 = 0 * MONTH;
const M1 = 1 * MONTH;
const M6 = 6 * MONTH;

describe("Integrator", async function () {
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
    Integrator = await ethers.getContractFactory("IntegratorTest");
    expect(Integrator).to.exist;
  });
  before(async function () {
    integrator = await Integrator.deploy();
    expect(integrator).to.exist;
  });
  describe("headOf", async function () {
    it("should return [0,0,0]", async function () {
      const [stamp, value, area] = await integrator.headOf();
      Expect([stamp, value, area]).to.deep.eq([0, 0, 0]);
    });
  });
  describe("lastOf", async function () {
    it("should return [0,0,0]", async function () {
      const [stamp, value, area] = await integrator.lastOf();
      Expect([stamp, value, area]).to.deep.eq([0, 0, 0]);
    });
  });
  describe("areaOf(M{0,1,6}, {0,1000})", async function () {
    it("should return 000 at (M0, 00%)", async function () {
      const area = await integrator.areaOf(M0, 0);
      expect(area).to.eq(0);
    });
    it("should return 000 at (M1, 00%)", async function () {
      const area = await integrator.areaOf(M1, 0);
      expect(area).to.eq(0);
    });
    it("should return 000 at (M6, 00%)", async function () {
      const area = await integrator.areaOf(M6, 0);
      expect(area).to.eq(0);
    });
    it("should return 000 at (M0, 01%)", async function () {
      const area = await integrator.areaOf(M0, 1000);
      expect(area).to.eq(0);
    });
    it("should return 000 at (M1, 01%)", async function () {
      const area = await integrator.areaOf(M1, 1000);
      expect(area).to.eq(0);
    });
    it("should return 000 at (M6, 01%)", async function () {
      const area = await integrator.areaOf(M6, 1000);
      expect(area).to.eq(0);
    });
  });
  describe("meanOf(M{0,1,6}, {0,1000})", async function () {
    it("should return 000 at (M0, 00%)", async function () {
      const mean = await integrator.meanOf(M0, 0);
      expect(mean).to.eq(0);
    });
    it("should return 000 at (M1, 00%)", async function () {
      const mean = await integrator.meanOf(M1, 0);
      expect(mean).to.eq(0);
    });
    it("should return 000 at (M6, 00%)", async function () {
      const mean = await integrator.meanOf(M6, 0);
      expect(mean).to.eq(0);
    });
    it("should return 000 at (M0, 01%)", async function () {
      const mean = await integrator.meanOf(M0, 1000);
      expect(mean).to.eq(0);
    });
    it("should return 000 at (M1, 01%)", async function () {
      const mean = await integrator.meanOf(M1, 1000);
      expect(mean).to.eq(0);
    });
    it("should return 000 at (M6, 01%)", async function () {
      const mean = await integrator.meanOf(M6, 1000);
      expect(mean).to.eq(0);
    });
  });
  describe("append", async function () {
    it("should append (M0, 00%)", async function () {
      const tx = await integrator.append(M0, 0);
      expect(tx).to.not.eq(undefined);
    });
  });
  describe("areaOf(M{0,1,6}, {0,1000})", async function () {
    it("should return 000 at (M0, 00%)", async function () {
      const area = await integrator.areaOf(M0, 0);
      expect(area).to.eq(0);
    });
    it("should return 000 at (M1, 00%)", async function () {
      const area = await integrator.areaOf(M1, 0);
      expect(area).to.eq(0);
    });
    it("should return 000 at (M6, 00%)", async function () {
      const area = await integrator.areaOf(M6, 0);
      expect(area).to.eq(0);
    });
    it("should return 000 at (M0, 01%)", async function () {
      const area = await integrator.areaOf(M0, 1000);
      expect(area).to.eq(0);
    });
    it("should return M1k at (M1, 01%)", async function () {
      const area = await integrator.areaOf(M1, 1000);
      expect(area).to.eq(M1 * 1000);
    });
    it("should return M6k at (M6, 01%)", async function () {
      const area = await integrator.areaOf(M6, 1000);
      expect(area).to.eq(M6 * 1000);
    });
  });
  describe("meanOf(M{0,1,6}, {0,1000})", async function () {
    it("should return 00% at (M0, 00%)", async function () {
      const mean = await integrator.meanOf(M0, 0);
      expect(mean).to.eq(0);
    });
    it("should return 00% at (M1, 00%)", async function () {
      const mean = await integrator.meanOf(M1, 0);
      expect(mean).to.eq(0);
    });
    it("should return 00% at (M6, 00%)", async function () {
      const mean = await integrator.meanOf(M6, 0);
      expect(mean).to.eq(0);
    });
    it("should return 00% at (M0, 01%)", async function () {
      const mean = await integrator.meanOf(M0, 1000);
      expect(mean).to.eq(0);
    });
    it("should return 01% at (M1, 01%)", async function () {
      const mean = await integrator.meanOf(M1, 1000);
      expect(mean).to.eq(1000);
    });
    it("should return 01% at (M6, 01%)", async function () {
      const mean = await integrator.meanOf(M6, 1000);
      expect(mean).to.eq(1000);
    });
  });
  describe("append", async function () {
    it("should append (M1, 01%)", async function () {
      const tx = await integrator.append(M1, 1000);
      expect(tx).to.not.eq(undefined);
    });
  });
  describe("areaOf(M{0,1,6}, {0,1000})", async function () {
    it("should return not at (M0, 00%)", async function () {
      const area = await integrator.areaOf(M0, 0).catch((ex) => {
        const m = ex.message.match(/invalid stamp/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(area).to.eq(undefined);
    });
    it("should return M1k at (M1, 00%)", async function () {
      const area = await integrator.areaOf(M1, 0);
      expect(area).to.eq(M1 * 1000);
    });
    it("should return M6k at (M6, 00%)", async function () {
      const area = await integrator.areaOf(M6, 0);
      expect(area).to.eq(M1 * 1000);
    });
    it("should return not at (M0, 01%)", async function () {
      const area = await integrator.areaOf(M0, 1000).catch((ex) => {
        const m = ex.message.match(/invalid stamp/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(area).to.eq(undefined);
    });
    it("should return M1k at (M1, 01%)", async function () {
      const area = await integrator.areaOf(M1, 1000);
      expect(area).to.eq(M1 * 1000);
    });
    it("should return M6k at (M6, 01%)", async function () {
      const area = await integrator.areaOf(M6, 1000);
      expect(area).to.eq(M6 * 1000);
    });
  });
  describe("meanOf(M{0,1,6}, {0,1000})", async function () {
    it("should return not at (M0, 00%)", async function () {
      const mean = await integrator.meanOf(M0, 0).catch((ex) => {
        const m = ex.message.match(/invalid stamp/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(mean).to.eq(undefined);
    });
    it("should return 00% at (M1, 00%)", async function () {
      const mean = await integrator.meanOf(M1, 0);
      expect(mean).to.eq(1000);
    });
    it("should return 00% at (M6, 00%)", async function () {
      const mean = await integrator.meanOf(M6, 0);
      expect(mean).to.eq(166);
    });
    it("should return not at (M0, 01%)", async function () {
      const mean = await integrator.meanOf(M0, 1000).catch((ex) => {
        const m = ex.message.match(/invalid stamp/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(mean).to.eq(undefined);
    });
    it("should return 01% at (M1, 01%)", async function () {
      const mean = await integrator.meanOf(M1, 1000);
      expect(mean).to.eq(1000);
    });
    it("should return 01% at (M6, 01%)", async function () {
      const mean = await integrator.meanOf(M6, 1000);
      expect(mean).to.eq(1000);
    });
  });
  describe("append", async function () {
    it("should append (M6, 01%)", async function () {
      const tx = await integrator.append(M6, 1000);
      expect(tx).to.not.eq(undefined);
    });
  });
  describe("areaOf(M{0,1,6}, {0,1000})", async function () {
    it("should return not at (M0, 00%)", async function () {
      const area = await integrator.areaOf(M0, 0).catch((ex) => {
        const m = ex.message.match(/invalid stamp/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(area).to.eq(undefined);
    });
    it("should return not at (M1, 00%)", async function () {
      const area = await integrator.areaOf(M1, 0).catch((ex) => {
        const m = ex.message.match(/invalid stamp/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(area).to.eq(undefined);
    });
    it("should return M6k at (M6, 00%)", async function () {
      const area = await integrator.areaOf(M6, 0);
      expect(area).to.eq(M6 * 1000);
    });
    it("should return not at (M0, 01%)", async function () {
      const area = await integrator.areaOf(M0, 1000).catch((ex) => {
        const m = ex.message.match(/invalid stamp/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(area).to.eq(undefined);
    });
    it("should return not at (M1, 01%)", async function () {
      const area = await integrator.areaOf(M1, 1000).catch((ex) => {
        const m = ex.message.match(/invalid stamp/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(area).to.eq(undefined);
    });
    it("should return M6k at (M6, 01%)", async function () {
      const area = await integrator.areaOf(M6, 1000);
      expect(area).to.eq(M6 * 1000);
    });
  });
  describe("meanOf(M{0,1,6}, {0,1000})", async function () {
    it("should return not at (M0, 00%)", async function () {
      const mean = await integrator.meanOf(M0, 0).catch((ex) => {
        const m = ex.message.match(/invalid stamp/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(mean).to.eq(undefined);
    });
    it("should return not at (M1, 00%)", async function () {
      const mean = await integrator.meanOf(M1, 0).catch((ex) => {
        const m = ex.message.match(/invalid stamp/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(mean).to.eq(undefined);
    });
    it("should return 00% at (M6, 00%)", async function () {
      const mean = await integrator.meanOf(M6, 0);
      expect(mean).to.eq(1000);
    });
    it("should return not at (M0, 01%)", async function () {
      const mean = await integrator.meanOf(M0, 1000).catch((ex) => {
        const m = ex.message.match(/invalid stamp/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(mean).to.eq(undefined);
    });
    it("should return not at (M1, 01%)", async function () {
      const mean = await integrator.meanOf(M1, 1000).catch((ex) => {
        const m = ex.message.match(/invalid stamp/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(mean).to.eq(undefined);
    });
    it("should return 01% at (M6, 01%)", async function () {
      const mean = await integrator.meanOf(M6, 1000);
      expect(mean).to.eq(1000);
    });
  });
});
function Expect(big_numbers) {
  return expect(big_numbers.map((bn) => bn.toNumber())).deep;
}
