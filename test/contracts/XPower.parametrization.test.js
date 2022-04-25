/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contract
let xpower; // instance

const NONE_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years

describe("XPower", async function () {
  before(async function () {
    await network.provider.send("hardhat_reset");
  });
  before(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
    addresses = accounts.map((acc) => acc.address);
    expect(addresses.length).to.be.greaterThan(0);
  });
  before(async function () {
    XPower = await ethers.getContractFactory("XPowerLokiTest");
  });
  beforeEach(async function () {
    xpower = await XPower.deploy(NONE_ADDRESS, DEADLINE);
    await xpower.deployed();
    await xpower.init();
  });
  describe("parametrization of treasure-for", async function () {
    it("should get theta array", async function () {
      Expect(await xpower.getTheta()).to.equal([0, 2, 1, 0]);
    });
    it("should set theta array", async function () {
      await xpower.setTheta([1, 3, 2, 0]);
      Expect(await xpower.getTheta()).to.equal([1, 3, 2, 0]);
    });
    it("should *not* set theta array (invalid array.length)", async function () {
      expect(
        await xpower.setTheta([1, 3, 2]).catch((ex) => {
          const m = ex.message.match(/invalid array.length/);
          if (m === null) console.debug(ex);
          expect().to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await xpower.getTheta()).to.equal([0, 2, 1, 0]);
    });
    it("should *not* set theta array (not owner)", async function () {
      const [owner, signer_1] = await ethers.getSigners();
      expect(
        await xpower
          .connect(signer_1)
          .setTheta([1, 3, 2, 0])
          .catch((ex) => {
            const m = ex.message.match(/caller is not the owner/);
            if (m === null) console.debug(ex);
            expect().to.be.not.null;
          })
      ).to.eq(undefined);
      Expect(await xpower.getTheta()).to.equal([0, 2, 1, 0]);
    });
  });
  describe("parametrization of difficulty-for", async function () {
    it("should get delta array", async function () {
      Expect(await xpower.getDelta()).to.equal([0, 4, 1, 0]);
    });
    it("should set delta array", async function () {
      await xpower.setDelta([1, 3, 2, 0]);
      Expect(await xpower.getDelta()).to.equal([1, 3, 2, 0]);
    });
    it("should *not* set delta array (invalid array.length)", async function () {
      expect(
        await xpower.setDelta([1, 3, 2]).catch((ex) => {
          const m = ex.message.match(/invalid array.length/);
          if (m === null) console.debug(ex);
          expect().to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await xpower.getDelta()).to.equal([0, 4, 1, 0]);
    });
    it("should *not* set delta array (not owner)", async function () {
      const [owner, signer_1] = await ethers.getSigners();
      expect(
        await xpower
          .connect(signer_1)
          .setDelta([1, 3, 2, 0])
          .catch((ex) => {
            const m = ex.message.match(/caller is not the owner/);
            if (m === null) console.debug(ex);
            expect().to.be.not.null;
          })
      ).to.eq(undefined);
      Expect(await xpower.getDelta()).to.equal([0, 4, 1, 0]);
    });
  });
});
function Expect(array) {
  return expect(array.map((bn) => bn.toNumber())).deep;
}
