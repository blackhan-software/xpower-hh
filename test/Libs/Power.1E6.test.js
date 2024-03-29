const { ethers } = require("hardhat");
const { expect } = require("chai");

let power; // instance

describe("Power", async function () {
  const error = (p, ref) => {
    const e = Math.abs(Number(p) - Number(ref)) / Number(ref);
    return `${(100 * e).toFixed(2)}%`;
  };
  before(async function () {
    power = await ethers.deployContract("PowerTest");
    expect(power).to.be.an("object");
  });
  describe("raise", async function () {
    const ref_0 = 1;
    it(`should *not* return 1E6^0.000 = ${ref_0} (exp: too small)`, async () => {
      await expect(power.raise(1e6, 0)).to.have.revertedWith(
        "invalid exponent: too small",
      );
    });
    const ref_1 = 6;
    it(`should *not* return 1E6^0.125 = ${ref_1} (exp: too small)`, async () => {
      await expect(power.raise(1e6, 32)).to.have.revertedWith(
        "invalid exponent: too small",
      );
    });
    const ref_2 = 32;
    it(`should *not* return 1E6^0.250 = ${ref_2} (exp: too small)`, async () => {
      await expect(power.raise(1e6, 64)).to.have.revertedWith(
        "invalid exponent: too small",
      );
    });
    const ref_3 = 178;
    it(`should *not* return 1E6^0.375 = ${ref_3} (exp: too small)`, async () => {
      await expect(power.raise(1e6, 96)).to.have.revertedWith(
        "invalid exponent: too small",
      );
    });
  });
  describe("raise", async function () {
    const ref_4 = 1_000;
    it(`should return 1E6^0.500 = ${ref_4}`, async function () {
      const p = await power.raise(1e6, 128);
      console.debug("[Δ%]", error(p, ref_4), p);
      expect(p).to.eq(999n);
    });
    const ref_5 = 5_623;
    it(`should return 1E6^0.625 = ${ref_5}`, async function () {
      const p = await power.raise(1e6, 160);
      console.debug("[Δ%]", error(p, ref_5), p);
      expect(p).to.eq(5623n);
    });
    const ref_6 = 31_623;
    it(`should return 1E6^0.750 = ${ref_6}`, async function () {
      const p = await power.raise(1e6, 192);
      console.debug("[Δ%]", error(p, ref_6), p);
      expect(p).to.eq(31_622n);
    });
    const ref_7 = 177_828;
    it(`should return 1E6^0.875 = ${ref_7}`, async function () {
      const p = await power.raise(1e6, 224);
      console.debug("[Δ%]", error(p, ref_7), p);
      expect(p).to.eq(177_827n);
    });
    const ref_8 = 1_000_000;
    it(`should return 1E6^1.000 = ${ref_8}`, async function () {
      const p = await power.raise(1e6, 256);
      console.debug("[Δ%]", error(p, ref_8), p);
      expect(p).to.eq(1_000_000n);
    });
    const ref_9 = 5_623_413;
    it(`should return 5E5^1.125 = ${ref_9}`, async function () {
      const p = await power.raise(1e6, 288);
      console.debug("[Δ%]", error(p, ref_9), p);
      expect(p).to.eq(5_623_413n);
    });
    const ref_10 = 31_622_771;
    it(`should return 1E6^1.250 = ${ref_10}`, async function () {
      const p = await power.raise(1e6, 320);
      console.debug("[Δ%]", error(p, ref_10), p);
      expect(p).to.eq(31_622_776n);
    });
    const ref_11 = 177_827_941;
    it(`should return 1E6^1.375 = ${ref_11}`, async function () {
      const p = await power.raise(1e6, 352);
      console.debug("[Δ%]", error(p, ref_11), p);
      expect(p).to.eq(177_827_941n);
    });
    const ref_12 = 1_000_000_000;
    it(`should return 1E6^1.500 = ${ref_12}`, async function () {
      const p = await power.raise(1e6, 384);
      console.debug("[Δ%]", error(p, ref_12), p);
      expect(p).to.eq(999999999n);
    });
    const ref_13 = 5_623_413_252;
    it(`should return 1E6^1.625 = ${ref_13}`, async function () {
      const p = await power.raise(1e6, 416);
      console.debug("[Δ%]", error(p, ref_13), p);
      expect(p).to.eq(5_623_413_251n);
    });
    const ref_14 = 31_622_776_602;
    it(`should return 1E6^1.750 = ${ref_14}`, async function () {
      const p = await power.raise(1e6, 448);
      console.debug("[Δ%]", error(p, ref_14), p);
      expect(p).to.eq(31_622_776_601n);
    });
    const ref_15 = 177_827_941_004;
    it(`should return 1E6^1.875 = ${ref_15}`, async function () {
      const p = await power.raise(1e6, 480);
      console.debug("[Δ%]", error(p, ref_15), p);
      expect(p).to.eq(177_827_941_003n);
    });
    const ref_16 = 1_000_000_000_000;
    it(`should return 1E6^2.000 = ${ref_16}`, async function () {
      const p = await power.raise(1e6, 512);
      console.debug("[Δ%]", error(p, ref_16), p);
      expect(p).to.eq(999_999_999_999n);
    });
  });
  describe("raise", async function () {
    const ref_32 = 1e24;
    it(`should *not* return 1E6^4.000 = ${ref_32} (exp: too large)`, async () => {
      await expect(power.raise(1e6, 1024)).to.have.revertedWith(
        "invalid exponent: too large",
      );
    });
  });
});
