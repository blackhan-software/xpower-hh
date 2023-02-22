/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contracts
let xpower; // instances

const DEADLINE = 126_230_400; // [seconds] i.e. 4 years
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
    XPower = await ethers.getContractFactory("XPowerThor");
    expect(XPower).to.exist;
  });
  before(async function () {
    xpower = await XPower.deploy([], DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
    await xpower.init();
  });
  describe("grant-role", async function () {
    it(`should grant reparametrization right`, async function () {
      await xpower.grantRole(xpower.SHARE_ROLE(), addresses[0]);
    });
  });
  describe("set-share", async function () {
    it(`should reparameterize at 50[%]`, async function () {
      const tx = await xpower.setShare([0, 0, 2, 1]);
      expect(tx).to.not.eq(undefined);
    });
    it("should forward time by one month", async function () {
      await network.provider.send("evm_increaseTime", [MONTH]);
      await network.provider.send("evm_mine", []);
    });
  });
  describe("set-share (monthly doubling for 24 months)", async function () {
    for (let m = 1; m <= 24; m++) {
      it("should print current & target values", async function () {
        const target = (await xpower.shareTargetOf(UNIT)).toString();
        const share = (await xpower.shareOf(UNIT)).toString();
        console.debug("[SHARE]", m, share, target);
      });
      it(`should reparameterize at ${pct(m)}[%]`, async function () {
        const tx = await xpower.setShare([0, 0, 2, 2 ** m]);
        expect(tx).to.not.eq(undefined);
      });
      it("should forward time by one month", async function () {
        await network.provider.send("evm_increaseTime", [MONTH]);
        await network.provider.send("evm_mine", []);
      });
    }
  });
});
function pct(m) {
  return 100 * 2 ** (m - 1);
}
