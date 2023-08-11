/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let Poly; // contracts
let poly; // instances

describe("Polynomials", async function () {
  before(async function () {
    await network.provider.send("hardhat_reset");
  });
  before(async function () {
    Poly = await ethers.getContractFactory("PolynomialsTest");
    expect(Poly).to.exist;
  });
  before(async function () {
    poly = await Poly.deploy();
    expect(poly).to.exist;
    await poly.deployed();
  });
  describe("eval6", async function () {
    it("should return 0", async function (a = [0, 0, 1, 0, 0, 0, 8]) {
      expect(await poly.eval6({ array: a }, 0)).to.eq(0);
    });
    it("should return 1", async function (a = [1, 1, 1, 1, 1, 1, 8]) {
      expect(await poly.eval6({ array: a }, 1)).to.eq(1);
    });
    it("should return 2", async function (a = [1, 1, 1, 1, 1, 1, 8]) {
      expect(await poly.eval6({ array: a }, 2)).to.eq(2);
    });
    it("should *not* return 0", async function (a = [0, 0, 0, 0, 0, 0, 8]) {
      expect(
        await poly.eval6({ array: a }, 0).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 18/); // div-by-zero
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 1", async function (a = [1, 1, 0, 1, 1, 1, 8]) {
      expect(
        await poly.eval6({ array: a }, 1).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 18/); // div-by-zero
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 2", async function (a = []) {
      expect(
        await poly.eval6({ array: a }, 2).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 50/); // out-of-bounds
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("eval5", async function () {
    it("should return 0", async function (a = [0, 1, 0, 0, 0, 8]) {
      expect(await poly.eval5({ array: a }, 0)).to.eq(0);
    });
    it("should return 2", async function (a = [1, 1, 1, 1, 1, 8]) {
      expect(await poly.eval5({ array: a }, 1)).to.eq(2);
    });
    it("should return 3", async function (a = [1, 1, 1, 1, 1, 8]) {
      expect(await poly.eval5({ array: a }, 2)).to.eq(3);
    });
    it("should *not* return 0", async function (a = [0, 0, 0, 0, 0, 8]) {
      expect(
        await poly.eval5({ array: a }, 0).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 18/); // div-by-zero
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 1", async function (a = [1, 0, 1, 1, 1, 8]) {
      expect(
        await poly.eval5({ array: a }, 1).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 18/); // div-by-zero
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 2", async function (a = []) {
      expect(
        await poly.eval5({ array: a }, 2).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 50/); // out-of-bounds
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("eval4", async function () {
    it("should return 0", async function (a = [0, 0, 1, 0, 8]) {
      expect(await poly.eval4({ array: a }, 0)).to.eq(0);
    });
    it("should return 1", async function (a = [1, 1, 1, 1, 8]) {
      expect(await poly.eval4({ array: a }, 1)).to.eq(1);
    });
    it("should return 2", async function (a = [1, 1, 1, 1, 8]) {
      expect(await poly.eval4({ array: a }, 2)).to.eq(2);
    });
    it("should *not* return 0", async function (a = [0, 0, 0, 0, 8]) {
      expect(
        await poly.eval4({ array: a }, 0).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 18/); // div-by-zero
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 1", async function (a = [1, 1, 0, 1, 8]) {
      expect(
        await poly.eval4({ array: a }, 1).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 18/); // div-by-zero
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 2", async function (a = []) {
      expect(
        await poly.eval4({ array: a }, 2).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 50/); // out-of-bounds
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("eval3", async function () {
    it("should return 0", async function (a = [0, 1, 0, 8]) {
      expect(await poly.eval3({ array: a }, 0)).to.eq(0);
    });
    it("should return 2", async function (a = [1, 1, 1, 8]) {
      expect(await poly.eval3({ array: a }, 1)).to.eq(2);
    });
    it("should return 3", async function (a = [1, 1, 1, 8]) {
      expect(await poly.eval3({ array: a }, 2)).to.eq(3);
    });
    it("should *not* return 0", async function (a = [0, 0, 0, 0, 8]) {
      expect(
        await poly.eval3({ array: a }, 0).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 18/); // div-by-zero
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 1", async function (a = [1, 0, 1, 8]) {
      expect(
        await poly.eval3({ array: a }, 1).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 18/); // div-by-zero
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* return 2", async function (a = []) {
      expect(
        await poly.eval3({ array: a }, 2).catch((ex) => {
          const m = ex.message.match(/reverted with panic code 50/); // out-of-bounds
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
});
