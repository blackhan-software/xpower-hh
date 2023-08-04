/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let Power; // contracts
let power; // instances

describe("Power", async function () {
  before(async function () {
    await network.provider.send("hardhat_reset");
  });
  before(async function () {
    Power = await ethers.getContractFactory("PowerTest");
    expect(Power).to.exist;
  });
  before(async function () {
    power = await Power.deploy();
    expect(power).to.exist;
  });
  describe("raised", async function () {
    const ref_0 = 1;
    it(`should return 1E6^0.000 = ${ref_0} ~ 1.00`, async function () {
      const p = await power.raised(1e6, 0);
      console.debug("[Δ%]", (p - ref_0) / ref_0);
      expect(p).to.eq(1);
    });
    const ref_1 = 6;
    it(`should return 1E6^0.125 = ${ref_1} ~ 5.62`, async function () {
      const p = await power.raised(1e6, 1);
      console.debug("[Δ%]", (p - ref_1) / ref_1);
      expect(p).to.eq(6);
    });
    const ref_2 = 32;
    it(`should return 1E6^0.250 = ${ref_2} ~ 31.62`, async function () {
      const p = await power.raised(1e6, 2);
      console.debug("[Δ%]", (p - ref_2) / ref_2);
      expect(p).to.eq(32);
    });
    const ref_3 = 178;
    it(`should return 1E6^0.375 = ${ref_3} ~ 177.83`, async function () {
      const p = await power.raised(1e6, 3);
      console.debug("[Δ%]", (p - ref_3) / ref_3);
      expect(p).to.eq(179);
    });
    const ref_4 = 1_000;
    it(`should return 1E6^0.500 = ${ref_4} ~ 1'000.00`, async function () {
      const p = await power.raised(1e6, 4);
      console.debug("[Δ%]", (p - ref_4) / ref_4);
      expect(p).to.eq(1_000);
    });
    const ref_5 = 5_623;
    it(`should return 1E6^0.625 = ${ref_5} ~ 5'623.41`, async function () {
      const p = await power.raised(1e6, 5);
      console.debug("[Δ%]", (p - ref_5) / ref_5);
      expect(p).to.eq(5_657);
    });
    const ref_6 = 31_623;
    it(`should return 1E6^0.750 = ${ref_6} ~ 31'622.78`, async function () {
      const p = await power.raised(1e6, 6);
      console.debug("[Δ%]", (p - ref_6) / ref_6);
      expect(p).to.eq(31_623);
    });
    const ref_7 = 177_828;
    it(`should return 1E6^0.875 = ${ref_7} ~ 177'827.94`, async function () {
      const p = await power.raised(1e6, 7);
      console.debug("[Δ%]", (p - ref_7) / ref_7);
      expect(p).to.eq(178_886);
    });
    const ref_8 = 1_000_000;
    it(`should return 1E6^1.000 = ${ref_8} ~ 1'000'000.00`, async function () {
      const p = await power.raised(1e6, 8);
      console.debug("[Δ%]", (p - ref_8) / ref_8);
      expect(p).to.eq(1_000_000);
    });
    const ref_9 = 5_623_413;
    it(`should return 1E6^1.125 = ${ref_9} ~ 5'623'413.25`, async function () {
      const p = await power.raised(1e6, 9);
      console.debug("[Δ%]", (p - ref_9) / ref_9);
      expect(p).to.eq(6_000_000);
    });
    const ref_10 = 31_622_771;
    it(`should return 1E6^1.250 = ${ref_10} ~ 31'622'776.60`, async function () {
      const p = await power.raised(1e6, 10);
      console.debug("[Δ%]", (p - ref_10) / ref_10);
      expect(p).to.eq(32_000_000);
    });
    const ref_11 = 177_827_941;
    it(`should return 1E6^1.375 = ${ref_11} ~ 177'827'941.00`, async function () {
      const p = await power.raised(1e6, 11);
      console.debug("[Δ%]", (p - ref_11) / ref_11);
      expect(p).to.eq(179_000_000);
    });
    const ref_12 = 1_000_000_000;
    it(`should return 1E6^1.500 = ${ref_12} ~ 1'000'000'000.00`, async function () {
      const p = await power.raised(1e6, 12);
      console.debug("[Δ%]", (p - ref_12) / ref_12);
      expect(p).to.eq(1_000_000_000);
    });
    const ref_13 = 5_623_413_252;
    it(`should return 1E6^1.625 = ${ref_13} ~ 5'623'413'251.90`, async function () {
      const p = await power.raised(1e6, 13);
      console.debug("[Δ%]", (p - ref_13) / ref_13);
      expect(p).to.eq(5_657_000_000);
    });
    const ref_14 = 31_622_776_602;
    it(`should return 1E6^1.750 = ${ref_14} ~ 31'622'776'601.68`, async function () {
      const p = await power.raised(1e6, 14);
      console.debug("[Δ%]", (p - ref_14) / ref_14);
      expect(p).to.eq(31_623_000_000);
    });
    const ref_15 = 177_827_941_004;
    it(`should return 1E6^1.875 = ${ref_15} ~ 177'827'941'003.89`, async function () {
      const p = await power.raised(1e6, 15);
      console.debug("[Δ%]", (p - ref_15) / ref_15);
      expect(p).to.eq(178_886_000_000);
    });
    const ref_16 = 1_000_000_000_000;
    it(`should return 1E6^2.000 = ${ref_16} ~ 1'000'000'000'000.00`, async function () {
      const p = await power.raised(1e6, 16);
      console.debug("[Δ%]", (p - ref_16) / ref_16);
      expect(p).to.eq(1_000_000_000_000);
    });
  });
});
