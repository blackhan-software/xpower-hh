/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let Interpolator; // contracts
let interpolator; // instances

describe("Interpolator", async function () {
  before(async function () {
    await network.provider.send("hardhat_reset");
  });
  before(async function () {
    Interpolator = await ethers.getContractFactory("InterpolatorTest");
    expect(Interpolator).to.exist;
  });
  before(async function () {
    interpolator = await Interpolator.deploy();
    expect(interpolator).to.exist;
  });
  describe("linear (ascending)", async function () {
    it("should return 10", async function () {
      expect(await interpolator.linear(10, 10, 90, 90, 0)).to.eq(10);
    });
    it("should return 50", async function () {
      expect(await interpolator.linear(10, 10, 90, 90, 50)).to.eq(50);
    });
    it("should return 90", async function () {
      expect(await interpolator.linear(10, 10, 90, 90, 100)).to.eq(90);
    });
  });
  describe("linear (descending)", async function () {
    it("should return 90", async function () {
      expect(await interpolator.linear(10, 90, 90, 10, 0)).to.eq(90);
    });
    it("should return 50", async function () {
      expect(await interpolator.linear(10, 90, 90, 10, 50)).to.eq(50);
    });
    it("should return 10", async function () {
      expect(await interpolator.linear(10, 90, 90, 10, 100)).to.eq(10);
    });
  });
  describe("linear (constant)", async function () {
    it("should return 10", async function () {
      expect(await interpolator.linear(10, 10, 90, 10, 0)).to.eq(10);
    });
    it("should return 10", async function () {
      expect(await interpolator.linear(10, 10, 90, 10, 50)).to.eq(10);
    });
    it("should return 10", async function () {
      expect(await interpolator.linear(10, 10, 90, 10, 100)).to.eq(10);
    });
  });
  describe("linear (degenerate)", async function () {
    it("should return 10", async function () {
      expect(await interpolator.linear(10, 10, 10, 10, 0)).to.eq(10);
    });
    it("should return 10", async function () {
      expect(await interpolator.linear(10, 10, 10, 10, 50)).to.eq(10);
    });
    it("should return 10", async function () {
      expect(await interpolator.linear(10, 10, 10, 10, 90)).to.eq(10);
    });
  });
  describe("linear (backwards)", async function () {
    it("should throw an error (invalid timeline)", async function () {
      expect(
        await interpolator.linear(90, 10, 10, 90, 0).catch((ex) => {
          const m = ex.message.match(/invalid timeline/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
});
