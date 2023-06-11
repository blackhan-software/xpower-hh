/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let Polynomials; // contracts
let polynomials; // instances

describe("Polynomials", async function () {
  before(async function () {
    await network.provider.send("hardhat_reset");
  });
  before(async function () {
    Polynomials = await ethers.getContractFactory("PolynomialsTest");
    expect(Polynomials).to.exist;
  });
  before(async function () {
    polynomials = await Polynomials.deploy();
    expect(polynomials).to.exist;
    await polynomials.deployed();
  });
  describe("eval6", async function () {
    it("should return 0", async function (a = [0, 0, 1, 0, 0, 0]) {
      expect(await polynomials.eval6({ array: a }, 0)).to.eq(0);
    });
    it("should return 1", async function (a = [1, 1, 1, 1, 1, 1]) {
      expect(await polynomials.eval6({ array: a }, 1)).to.eq(1);
    });
    it("should return 2", async function (a = [1, 1, 1, 1, 1, 1]) {
      expect(await polynomials.eval6({ array: a }, 2)).to.eq(2);
    });
    it("should *not* return 0", async function (a = [0, 0, 0, 0, 0, 0]) {
      expect(
        await polynomials.eval6({ array: a }, 0).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 18/); // div-by-zero
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 1", async function (a = [1, 1, 0, 1, 1, 1]) {
      expect(
        await polynomials.eval6({ array: a }, 1).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 18/); // div-by-zero
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 2", async function (a = []) {
      expect(
        await polynomials.eval6({ array: a }, 2).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 50/); // out-of-bounds
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("eval5", async function () {
    it("should return 0", async function (a = [0, 1, 0, 0, 0]) {
      expect(await polynomials.eval5({ array: a }, 0)).to.eq(0);
    });
    it("should return 2", async function (a = [1, 1, 1, 1, 1]) {
      expect(await polynomials.eval5({ array: a }, 1)).to.eq(2);
    });
    it("should return 3", async function (a = [1, 1, 1, 1, 1]) {
      expect(await polynomials.eval5({ array: a }, 2)).to.eq(3);
    });
    it("should *not* return 0", async function (a = [0, 0, 0, 0, 0]) {
      expect(
        await polynomials.eval5({ array: a }, 0).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 18/); // div-by-zero
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 1", async function (a = [1, 0, 1, 1, 1]) {
      expect(
        await polynomials.eval5({ array: a }, 1).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 18/); // div-by-zero
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 2", async function (a = []) {
      expect(
        await polynomials.eval5({ array: a }, 2).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 50/); // out-of-bounds
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("eval4", async function () {
    it("should return 0", async function (a = [0, 0, 1, 0]) {
      expect(await polynomials.eval4({ array: a }, 0)).to.eq(0);
    });
    it("should return 1", async function (a = [1, 1, 1, 1]) {
      expect(await polynomials.eval4({ array: a }, 1)).to.eq(1);
    });
    it("should return 2", async function (a = [1, 1, 1, 1]) {
      expect(await polynomials.eval4({ array: a }, 2)).to.eq(2);
    });
    it("should *not* return 0", async function (a = [0, 0, 0, 0]) {
      expect(
        await polynomials.eval4({ array: a }, 0).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 18/); // div-by-zero
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 1", async function (a = [1, 1, 0, 1]) {
      expect(
        await polynomials.eval4({ array: a }, 1).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 18/); // div-by-zero
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 2", async function (a = []) {
      expect(
        await polynomials.eval4({ array: a }, 2).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 50/); // out-of-bounds
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("eval3", async function () {
    it("should return 0", async function (a = [0, 1, 0]) {
      expect(await polynomials.eval3({ array: a }, 0)).to.eq(0);
    });
    it("should return 2", async function (a = [1, 1, 1]) {
      expect(await polynomials.eval3({ array: a }, 1)).to.eq(2);
    });
    it("should return 3", async function (a = [1, 1, 1]) {
      expect(await polynomials.eval3({ array: a }, 2)).to.eq(3);
    });
    it("should *not* return 0", async function (a = [0, 0, 0, 0]) {
      expect(
        await polynomials.eval3({ array: a }, 0).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 18/); // div-by-zero
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 1", async function (a = [1, 0, 1]) {
      expect(
        await polynomials.eval3({ array: a }, 1).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 18/); // div-by-zero
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 2", async function (a = []) {
      expect(
        await polynomials.eval3({ array: a }, 2).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 50/); // out-of-bounds
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("eval6Clamped", async function () {
    it("should return 0", async function (a = [0, 0, 1, 0, 0, 0]) {
      expect(await polynomials.eval6Clamped({ array: a }, 0)).to.eq(0);
    });
    it("should return 1", async function (a = [1, 1, 1, 1, 1, 1]) {
      expect(await polynomials.eval6Clamped({ array: a }, 1)).to.eq(1);
    });
    it("should return 2", async function (a = [1, 1, 1, 1, 1, 1]) {
      expect(await polynomials.eval6Clamped({ array: a }, 2)).to.eq(2);
    });
    it("should *not* return 0 (but uint256.max)", async function (a = [
      0, 0, 0, 0, 0, 0,
    ]) {
      expect(await polynomials.eval6Clamped({ array: a }, 0)).to.eq(
        2n ** 256n - 1n
      );
    });
    it("should *not* return 1", async function (a = [1, 1, 0, 1, 1, 1]) {
      expect(
        await polynomials.eval6Clamped({ array: a }, 1).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 17/); // overflow
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 2", async function (a = []) {
      expect(
        await polynomials.eval6Clamped({ array: a }, 2).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 50/); // out-of-bounds
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("eval5Clamped", async function () {
    it("should return 0", async function (a = [0, 1, 0, 0, 0]) {
      expect(await polynomials.eval5Clamped({ array: a }, 0)).to.eq(0);
    });
    it("should return 2", async function (a = [1, 1, 1, 1, 1]) {
      expect(await polynomials.eval5Clamped({ array: a }, 1)).to.eq(2);
    });
    it("should return 3", async function (a = [1, 1, 1, 1, 1]) {
      expect(await polynomials.eval5Clamped({ array: a }, 2)).to.eq(3);
    });
    it("should *not* return 0 (but uint256.max)", async function (a = [
      0, 0, 0, 0, 0,
    ]) {
      expect(await polynomials.eval5Clamped({ array: a }, 0)).to.eq(
        2n ** 256n - 1n
      );
    });
    it("should *not* return 1", async function (a = [1, 0, 1, 1, 1]) {
      expect(
        await polynomials.eval5Clamped({ array: a }, 1).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 17/); // overflow
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 2", async function (a = []) {
      expect(
        await polynomials.eval5Clamped({ array: a }, 2).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 50/); // out-of-bounds
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("eval4Clamped", async function () {
    it("should return 0", async function (a = [0, 0, 1, 0]) {
      expect(await polynomials.eval4Clamped({ array: a }, 0)).to.eq(0);
    });
    it("should return 1", async function (a = [1, 1, 1, 1]) {
      expect(await polynomials.eval4Clamped({ array: a }, 1)).to.eq(1);
    });
    it("should return 2", async function (a = [1, 1, 1, 1]) {
      expect(await polynomials.eval4Clamped({ array: a }, 2)).to.eq(2);
    });
    it("should *not* return 0 (but uint256.max)", async function (a = [
      0, 0, 0, 0,
    ]) {
      expect(await polynomials.eval4Clamped({ array: a }, 0)).to.eq(
        2n ** 256n - 1n
      );
    });
    it("should *not* return 1", async function (a = [1, 1, 0, 1]) {
      expect(
        await polynomials.eval4Clamped({ array: a }, 1).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 17/); // overflow
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 2", async function (a = []) {
      expect(
        await polynomials.eval4Clamped({ array: a }, 2).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 50/); // out-of-bounds
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("eval3Clamped", async function () {
    it("should return 0", async function (a = [0, 1, 0]) {
      expect(await polynomials.eval3Clamped({ array: a }, 0)).to.eq(0);
    });
    it("should return 2", async function (a = [1, 1, 1]) {
      expect(await polynomials.eval3Clamped({ array: a }, 1)).to.eq(2);
    });
    it("should return 3", async function (a = [1, 1, 1]) {
      expect(await polynomials.eval3Clamped({ array: a }, 2)).to.eq(3);
    });
    it("should *not* return 0 (but uint256.max)", async function (a = [
      0, 0, 0,
    ]) {
      expect(await polynomials.eval3Clamped({ array: a }, 0)).to.eq(
        2n ** 256n - 1n
      );
    });
    it("should *not* return 1", async function (a = [1, 0, 1]) {
      expect(
        await polynomials.eval3Clamped({ array: a }, 1).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 17/); // overflow
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 2", async function (a = []) {
      expect(
        await polynomials.eval3Clamped({ array: a }, 2).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 50/); // out-of-bounds
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
});
