const { ethers, network } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe; // contract
let moe; // instance

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
    Moe = await ethers.getContractFactory("XPower");
    expect(Moe).to.be.an("object");
  });
  before(async function () {
    moe = await Moe.deploy([], 0);
    expect(moe).to.be.an("object");
    await moe.init();
  });
  describe("grant-role", async function () {
    it("should grant reparametrization right", async function () {
      await moe.grantRole(moe.SHARE_ROLE(), addresses[0]);
    });
  });
  describe("set-share", async function () {
    it("should reparameterize at 50[%]", async function () {
      const tx = await moe.setShare([0, 2, 1, 256]);
      expect(tx).to.be.an("object");
    });
    it("should forward time by one month", async function () {
      await network.provider.send("evm_increaseTime", [MONTH]);
      await network.provider.send("evm_mine", []);
    });
  });
  describe("set-share (monthly doubling for 24 months)", async function () {
    for (let m = 1; m <= 24; m++) {
      it("should print current & target values", async function () {
        const target = (await moe.shareTargetOf(UNIT)).toString();
        const share = (await moe.shareOf(UNIT)).toString();
        console.debug("[SHARE]", m, share, target);
      });
      it(`should reparameterize at ${pct(m)}[%]`, async function () {
        const tx = await moe.setShare([0, 2, 2 ** m, 256]);
        expect(tx).to.be.an("object");
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
