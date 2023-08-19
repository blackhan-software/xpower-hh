const { ethers, network } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contract
let xpower; // instance

const DEADLINE = 126_230_400; // [seconds] i.e. 4 years
const DAYS = 86_400; // [seconds]
const U128 = 2n ** 128n - 1n;

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
    XPower = await ethers.getContractFactory("XPowerTest");
  });
  before(async function () {
    xpower = await XPower.deploy([], DEADLINE);
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
  describe("set-share (double from 50[%] to 100[%])", async function () {
    it("should forward time by one year", async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
      await network.provider.send("evm_mine", []);
    });
    it("should *not* reparameterize (too large)", async function () {
      await xpower.grantRole(xpower.SHARE_ROLE(), addresses[0]);
      const tx = await xpower.setShare([0, 2, 3, 256]).catch((ex) => {
        const m = ex.message.match(/invalid change: too large/);
        if (m === null) console.debug(ex);
        expect(m).to.not.eq(null);
      });
      expect(tx).to.eq(undefined);
    });
    it("should *not* reparameterize (too large)", async function () {
      await xpower.grantRole(xpower.SHARE_ROLE(), addresses[0]);
      const tx = await xpower.setShare([U128, 2, 1, 256]).catch((ex) => {
        const m = ex.message.match(/invalid change: too large/);
        if (m === null) console.debug(ex);
        expect(m).to.not.eq(null);
      });
      expect(tx).to.eq(undefined);
    });
    it("should *not* reparameterize (too small)", async function () {
      await xpower.grantRole(xpower.SHARE_ROLE(), addresses[0]);
      const tx = await xpower.setShare([0, 5, 1, 256]).catch((ex) => {
        const m = ex.message.match(/invalid change: too small/);
        if (m === null) console.debug(ex);
        expect(m).to.not.eq(null);
      });
      expect(tx).to.eq(undefined);
    });
    it("should reparameterize share at 100[%]", async function () {
      await xpower.grantRole(xpower.SHARE_ROLE(), addresses[0]);
      const tx = await xpower.setShare([0, 2, 2, 256]);
      expect(tx).to.be.an("object");
    });
    it("should *not* reparameterize (too frequent)", async function () {
      await xpower.grantRole(xpower.SHARE_ROLE(), addresses[0]);
      const tx = await xpower.setShare([0, 2, 1, 256]).catch((ex) => {
        const m = ex.message.match(/invalid change: too frequent/);
        if (m === null) console.debug(ex);
        expect(m).to.not.eq(null);
      });
      expect(tx).to.eq(undefined);
    });
  });
  describe("share-of (i.e tokens ~ amount × time)", async function () {
    it("should forward time by 0.25 year", async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 1:1 for zeros=0", async function () {
      expect(await xpower.shareOf(0)).to.eq(0);
    });
    for (let zeros = 1; zeros <= 64; zeros++) {
      it(`should return 1:1 for zeros=${zeros}`, async function () {
        const amount = await xpower.amountOf(zeros);
        const share = await xpower.shareOf(amount);
        const ratio = Number(`${amount}`) / Number(`${share}`);
        expect(ratio).to.be.approximately(1.0, 0.01);
      });
    }
  });
  describe("share-of (i.e tokens ~ amount × time)", async function () {
    it("should forward time by 0.25 year", async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 1:1 for zeros=0", async function () {
      expect(await xpower.shareOf(0)).to.eq(0);
    });
    for (let zeros = 1; zeros <= 64; zeros++) {
      it(`should return 1:1 for zeros=${zeros}`, async function () {
        const amount = await xpower.amountOf(zeros);
        const share = await xpower.shareOf(amount);
        const ratio = Number(`${amount}`) / Number(`${share}`);
        expect(ratio).to.be.approximately(1.0, 0.01);
      });
    }
  });
  describe("share-of (i.e tokens ~ amount × time)", async function () {
    it("should forward time by 0.25 year", async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 1:1 for zeros=0", async function () {
      expect(await xpower.shareOf(0)).to.eq(0);
    });
    for (let zeros = 1; zeros <= 64; zeros++) {
      it(`should return 1:1 for zeros=${zeros}`, async function () {
        const amount = await xpower.amountOf(zeros);
        const share = await xpower.shareOf(amount);
        const ratio = Number(`${amount}`) / Number(`${share}`);
        expect(ratio).to.be.approximately(1.0, 0.01);
      });
    }
  });
  describe("share-of (i.e tokens ~ amount × time)", async function () {
    it("should forward time by 0.25 year", async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 1:1 for zeros=0", async function () {
      expect(await xpower.shareOf(0)).to.eq(0);
    });
    for (let zeros = 1; zeros <= 64; zeros++) {
      it(`should return 1:1 for zeros=${zeros}`, async function () {
        const amount = await xpower.amountOf(zeros);
        const share = await xpower.shareOf(amount);
        const ratio = Number(`${amount}`) / Number(`${share}`);
        expect(ratio).to.be.approximately(1.0, 0.01);
      });
    }
  });
  describe("share-of (i.e tokens ~ amount × time)", async function () {
    it("should forward time by 999 years", async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 999]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 1:1 for zeros=0", async function () {
      expect(await xpower.shareOf(0)).to.eq(0);
    });
    for (let zeros = 1; zeros <= 64; zeros++) {
      it(`should return 1:1 for zeros=${zeros}`, async function () {
        const amount = await xpower.amountOf(zeros);
        const share = await xpower.shareOf(amount);
        const ratio = Number(`${amount}`) / Number(`${share}`);
        expect(ratio).to.be.approximately(1.0, 0.01);
      });
    }
  });
});