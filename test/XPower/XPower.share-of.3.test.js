const { ethers, network } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contract
let xpower; // instance

const MONTH = 2_629_800; // [seconds]
const UNIT = 10n ** 18n; // decimals

describe("XPower", async function () {
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
    XPower = await ethers.getContractFactory("XPower");
    expect(XPower).to.be.an("object");
  });
  before(async function () {
    xpower = await XPower.deploy([], 0);
    expect(xpower).to.be.an("object");
    await xpower.init();
  });
  describe("grant-role", async function () {
    it("should grant reparametrization right", async function () {
      await xpower.grantRole(xpower.SHARE_ROLE(), addresses[0]);
    });
  });
  describe("set-share", async function () {
    it("should reparameterize at 50[%]", async function () {
      const tx = await xpower.setShare([0, 2, 1, 256]);
      expect(tx).to.be.an("object");
    });
    it("should forward time by one month", async function () {
      await network.provider.send("evm_increaseTime", [MONTH]);
      await network.provider.send("evm_mine", []);
    });
  });
  describe("set-share", async function () {
    it("should reparameterize at 100[%]", async function () {
      const tx = await xpower.setShare([0, 2, 2, 256]);
      expect(tx).to.be.an("object");
    });
    for (let m = 1; m <= 24 * 4; m++) {
      it("should print current & target values", async function () {
        const target = (await xpower.shareTargetOf(UNIT)).toString();
        const share = (await xpower.shareOf(UNIT)).toString();
        console.debug("[SHARE]", m, share, target);
      });
      it("should forward time by one month", async function () {
        await network.provider.send("evm_increaseTime", [MONTH / 4]);
        await network.provider.send("evm_mine", []);
      });
    }
  });
});
