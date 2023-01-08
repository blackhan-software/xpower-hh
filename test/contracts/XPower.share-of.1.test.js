/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contract
let xpower; // instance

const DEADLINE = 126_230_400; // [seconds] i.e. 4 years
const UNIT = 10n ** 18n; // decimals
const DAYS = 86_400; // [seconds]

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
    XPower = await ethers.getContractFactory("XPowerThorTest");
  });
  before(async function () {
    xpower = await XPower.deploy([], DEADLINE);
    await xpower.deployed();
    await xpower.init();
  });
  describe("share-of (i.e tokens ~ amount)", async function () {
    for (let amount = 0n; amount <= 64n; amount++) {
      const share = amount / 2n;
      it(`should return ${share} for amount=${amount}`, async function () {
        expect(await xpower.shareOf(amount)).to.eq(share);
      });
    }
  });
  describe("set-treasury-share (double from 50% to 100%)", async function () {
    it(`should forward time by 1.00 year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
      await network.provider.send("evm_mine", []);
    });
    it("should *not* reparameterize (invalid change: too large)", async function () {
      await xpower.grantRole(xpower.TREASURY_SHARE_ROLE(), addresses[0]);
      expect(
        await xpower.setTreasuryShare([0, 0, 2, 3, 0, 0]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (invalid change: too large)", async function () {
      await xpower.grantRole(xpower.TREASURY_SHARE_ROLE(), addresses[0]);
      expect(
        await xpower
          .setTreasuryShare([0, UNIT + 1n, 2, 1, 0, 0])
          .catch((ex) => {
            const m = ex.message.match(/invalid change: too large/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (invalid change: too small)", async function () {
      await xpower.grantRole(xpower.TREASURY_SHARE_ROLE(), addresses[0]);
      expect(
        await xpower.setTreasuryShare([0, 0, 5, 1, 0, 0]).catch((ex) => {
          const m = ex.message.match(/invalid change: too small/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (invalid change: too small)", async function () {
      await xpower.grantRole(xpower.TREASURY_SHARE_ROLE(), addresses[0]);
      expect(
        await xpower
          .setTreasuryShare([UNIT / 4n + 1n, 0, 2, 1, 0, 0])
          .catch((ex) => {
            const m = ex.message.match(/invalid change: too small/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
    });
    it("should reparameterize", async function () {
      await xpower.grantRole(xpower.TREASURY_SHARE_ROLE(), addresses[0]);
      expect(await xpower.setTreasuryShare([0, 0, 1, 1, 0, 0])).to.not.eq(
        undefined
      );
    });
    it("should *not* reparameterize (invalid change: too frequent)", async function () {
      await xpower.grantRole(xpower.TREASURY_SHARE_ROLE(), addresses[0]);
      expect(
        await xpower.setTreasuryShare([0, 0, 2, 1, 0, 0]).catch((ex) => {
          const m = ex.message.match(/invalid change: too frequent/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("share-of (i.e tokens ~ amount × time)", async function () {
    it(`should forward time by 0.25 year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it(`should return 0.000'th for amount=0`, async function () {
      expect(await xpower.shareOf(0)).to.eq(0);
    });
    for (let amount = 1n; amount <= 64n; amount++) {
      it(`should return 0.625'th for amount=${amount}`, async function () {
        const share = await xpower.shareOf(amount * UNIT);
        const ratio = share.div((amount * UNIT * 5n) / 8n).abs();
        expect(ratio.toNumber()).to.be.approximately(1, 0.01);
      });
    }
  });
  describe("share-of (i.e tokens ~ amount × time)", async function () {
    it(`should forward time by 0.25 year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it(`should return 0.750'th for amount=0`, async function () {
      expect(await xpower.shareOf(0)).to.eq(0);
    });
    for (let amount = 1n; amount <= 64n; amount++) {
      it(`should return 0.750'th for amount=${amount}`, async function () {
        const share = await xpower.shareOf(amount * UNIT);
        const ratio = share.div((amount * UNIT * 6n) / 8n).abs();
        expect(ratio.toNumber()).to.be.approximately(1, 0.01);
      });
    }
  });
  describe("share-of (i.e tokens ~ amount × time)", async function () {
    it(`should forward time by 0.25 year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it(`should return 0.875'th for amount=0`, async function () {
      expect(await xpower.shareOf(0)).to.eq(0);
    });
    for (let amount = 1n; amount <= 64n; amount++) {
      it(`should return 0.875'th for amount=${amount}`, async function () {
        const share = await xpower.shareOf(amount * UNIT);
        const ratio = share.div((amount * UNIT * 7n) / 8n).abs();
        expect(ratio.toNumber()).to.be.approximately(1, 0.01);
      });
    }
  });
  describe("share-of (i.e tokens ~ amount × time)", async function () {
    it(`should forward time by 0.25 year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it(`should return 1.000'th for amount=0`, async function () {
      expect(await xpower.shareOf(0)).to.eq(0);
    });
    for (let amount = 1n; amount <= 64n; amount++) {
      it(`should return 1.000'th for amount=${amount}`, async function () {
        const share = await xpower.shareOf(amount * UNIT);
        const ratio = share.div((amount * UNIT * 8n) / 8n).abs();
        expect(ratio.toNumber()).to.be.approximately(1, 0.01);
      });
    }
  });
  describe("share-of (i.e tokens ~ amount × time)", async function () {
    it(`should forward time by 999 years`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 999]);
      await network.provider.send("evm_mine", []);
    });
    it(`should return 1.000'th for amount=0`, async function () {
      expect(await xpower.shareOf(0)).to.eq(0);
    });
    for (let amount = 1n; amount <= 64n; amount++) {
      it(`should return 1.000'th for amount=${amount}`, async function () {
        const share = await xpower.shareOf(amount * UNIT);
        const ratio = share.div((amount * UNIT * 8n) / 8n).abs();
        expect(ratio.toNumber()).to.be.approximately(1, 0.01);
      });
    }
  });
});
