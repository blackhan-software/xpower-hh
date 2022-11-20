/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contract
let xpower; // instance

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
    xpower = await XPower.deploy([], DEADLINE);
    await xpower.deployed();
    await xpower.init();
  });
  describe("parametrization of treasure-for", async function () {
    it("should get theta array", async function () {
      Expect(await xpower.getTreasuryShare()).to.equal([0, 0, 2, 1, 0, 0]);
    });
    it("should set theta array", async function () {
      await xpower.grantRole(xpower.TREASURY_SHARE_ROLE(), addresses[0]);
      await xpower.setTreasuryShare([1, 2, 3, 4, 5, 6]);
      Expect(await xpower.getTreasuryShare()).to.equal([1, 2, 3, 4, 5, 6]);
    });
    it("should *not* set theta array (invalid array.length)", async function () {
      await xpower.grantRole(xpower.TREASURY_SHARE_ROLE(), addresses[0]);
      expect(
        await xpower.setTreasuryShare([1, 3, 2]).catch((ex) => {
          const m = ex.message.match(/invalid array.length/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await xpower.getTreasuryShare()).to.equal([0, 0, 2, 1, 0, 0]);
    });
    it("should *not* set theta array (account is missing role)", async function () {
      const [owner, signer_1] = await ethers.getSigners();
      expect(
        await xpower
          .connect(signer_1)
          .setTreasuryShare([1, 2, 3, 4, 5, 6])
          .catch((ex) => {
            const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
      Expect(await xpower.getTreasuryShare()).to.equal([0, 0, 2, 1, 0, 0]);
    });
  });
  describe("parametrization of difficulty-for", async function () {
    it("should get delta array", async function () {
      Expect(await xpower.getMiningDifficulty()).to.equal([0, 0, 4, 1, 0, 0]);
    });
    it("should set delta array", async function () {
      await xpower.grantRole(xpower.MINING_DIFFICULTY_ROLE(), addresses[0]);
      await xpower.setMiningDifficulty([1, 2, 3, 4, 5, 6]);
      Expect(await xpower.getMiningDifficulty()).to.equal([1, 2, 3, 4, 5, 6]);
    });
    it("should *not* set delta array (invalid array.length)", async function () {
      await xpower.grantRole(xpower.MINING_DIFFICULTY_ROLE(), addresses[0]);
      expect(
        await xpower.setMiningDifficulty([1, 3, 2]).catch((ex) => {
          const m = ex.message.match(/invalid array.length/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await xpower.getMiningDifficulty()).to.equal([0, 0, 4, 1, 0, 0]);
    });
    it("should *not* set delta array (account is missing role)", async function () {
      const [owner, signer_1] = await ethers.getSigners();
      expect(
        await xpower
          .connect(signer_1)
          .setMiningDifficulty([1, 2, 3, 4, 5, 6])
          .catch((ex) => {
            const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
      Expect(await xpower.getMiningDifficulty()).to.equal([0, 0, 4, 1, 0, 0]);
    });
  });
});
function Expect(array) {
  return expect(array.map((bn) => bn.toNumber())).deep;
}
