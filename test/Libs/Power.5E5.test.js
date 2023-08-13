const { ethers } = require("hardhat");
const { expect } = require("chai");

let power; // instances

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
    it(`should *not* return 5E5^0.000 = ${ref_0} (exp: too small)`, async () => {
      await expect(power.raise(5e5, 0)).to.have.revertedWith(
        "invalid exponent: too small",
      );
    });
    const ref_1 = 5;
    it(`should *not* return 5E5^0.125 = ${ref_1} (exp: too small)`, async () => {
      await expect(power.raise(5e5, 1)).to.have.revertedWith(
        "invalid exponent: too small",
      );
    });
    const ref_2 = 27;
    it(`should *not* return 5E5^0.250 = ${ref_2} (exp: too small)`, async () => {
      await expect(power.raise(5e5, 2)).to.have.revertedWith(
        "invalid exponent: too small",
      );
    });
    const ref_3 = 137;
    it(`should *not* return 5E5^0.375 = ${ref_3} (exp: too small)`, async () => {
      await expect(power.raise(5e5, 3)).to.have.revertedWith(
        "invalid exponent: too small",
      );
    });
  });
  describe("raise", async function () {
    const ref_4 = 707;
    it(`should return 5E5^0.500 = ${ref_4}`, async function () {
      const p = await power.raise(5e5, 4);
      console.debug("[Δ%]", error(p, ref_4), p);
      expect(p).to.eq(707n);
    });
    const ref_5 = 3646;
    it(`should return 5E5^0.625 = ${ref_5}`, async function () {
      const p = await power.raise(5e5, 5);
      console.debug("[Δ%]", error(p, ref_5), p);
      expect(p).to.eq(3_646n);
    });
    const ref_6 = 18_803;
    it(`should return 5E5^0.750 = ${ref_6}`, async function () {
      const p = await power.raise(5e5, 6);
      console.debug("[Δ%]", error(p, ref_6), p);
      expect(p).to.eq(18_803n);
    });
    const ref_7 = 96_961;
    it(`should return 5E5^0.875 = ${ref_7}`, async function () {
      const p = await power.raise(5e5, 7);
      console.debug("[Δ%]", error(p, ref_7), p);
      expect(p).to.eq(96_961n);
    });
    const ref_8 = 500_000;
    it(`should return 5E5^1.000 = ${ref_8}`, async function () {
      const p = await power.raise(5e5, 8);
      console.debug("[Δ%]", error(p, ref_8), p);
      expect(p).to.eq(500_000n);
    });
    const ref_9 = 2_578_346;
    it(`should return 5E5^1.125 = ${ref_9}`, async function () {
      const p = await power.raise(5e5, 9);
      console.debug("[Δ%]", error(p, ref_9), p);
      expect(p).to.eq(2_578_346n);
    });
    const ref_10 = 13_295_740;
    it(`should return 5E5^1.250 = ${ref_10}`, async function () {
      const p = await power.raise(5e5, 10);
      console.debug("[Δ%]", error(p, ref_10), p);
      expect(p).to.eq(13_295_739n);
    });
    const ref_11 = 68_562_044;
    it(`should return 5E5^1.375 = ${ref_11}`, async function () {
      const p = await power.raise(5e5, 11);
      console.debug("[Δ%]", error(p, ref_11), p);
      expect(p).to.eq(68_562_043n);
    });
    const ref_12 = 353_553_391;
    it(`should return 5E5^1.500 = ${ref_12}`, async function () {
      const p = await power.raise(5e5, 12);
      console.debug("[Δ%]", error(p, ref_12), p);
      expect(p).to.eq(353_553_390n);
    });
    const ref_13 = 1_823_166_184;
    it(`should return 5E5^1.625 = ${ref_13}`, async function () {
      const p = await power.raise(5e5, 13);
      console.debug("[Δ%]", error(p, ref_13), p);
      expect(p).to.eq(1_823_166_184n);
    });
    const ref_14 = 9_401_507_733;
    it(`should return 5E5^1.750 = ${ref_14}`, async function () {
      const p = await power.raise(5e5, 14);
      console.debug("[Δ%]", error(p, ref_14), p);
      expect(p).to.eq(9_401_507_732n);
    });
    const ref_15 = 48_480_686_187;
    it(`should return 5E5^1.875 = ${ref_15}`, async function () {
      const p = await power.raise(5e5, 15);
      console.debug("[Δ%]", error(p, ref_15), p);
      expect(p).to.eq(48_480_686_187n);
    });
    const ref_16 = 250_000_000_000;
    it(`should return 5E5^2.000 = ${ref_16}`, async function () {
      const p = await power.raise(5e5, 16);
      console.debug("[Δ%]", error(p, ref_16), p);
      expect(p).to.eq(249_999_999_999n);
    });
  });
  describe("raise", async function () {
    const ref_32 = 1e24;
    it(`should *not* return 5E5^4.000 = ${ref_32} (exp: too large)`, async () => {
      await expect(power.raise(5e5, 32)).to.have.revertedWith(
        "invalid exponent: too large",
      );
    });
  });
});
