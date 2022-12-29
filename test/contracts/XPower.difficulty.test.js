/* eslint no-unused-expressions: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contract
let xpower; // instance

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const DEADLINE = 126_230_400; // [seconds] i.e. 4 years
const UNUM = 10n ** 18n;

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
  beforeEach(async function () {
    table = await new HashTable(xpower, addresses[0]).init();
  });
  describe("difficulty", async function () {
    it("should return difficulty=0", async function () {
      expect(await xpower.miningDifficulty(await block("timestamp"))).to.eq(0);
    });
    it("should return amount=0 (at difficulty=0)", async function () {
      const hash = table.getHash({ amount: 0 }); // w.r.t. difficulty=0
      expect(hash).to.be.a("string").and.to.match(/^0x/);
      const amount = await xpower.amountOf(hash);
      expect(amount.toBigInt()).to.eq(0n);
    });
    it("should return difficulty=0", async function () {
      await network.provider.send("hardhat_mine", ["0x7861f80"]); // 4 years
      expect(await xpower.miningDifficulty(await block("timestamp"))).to.eq(0);
    });
    it("should return amount=1 (at difficulty=0)", async function () {
      const hash = table.getHash({ amount: 1 }); // w.r.t. difficulty=0
      expect(hash).to.be.a("string").and.to.match(/^0x0/);
      const amount = await xpower.amountOf(hash);
      expect(amount.toBigInt()).to.eq(1n * UNUM);
    });
    it("should return difficulty=0", async function () {
      await network.provider.send("hardhat_mine", ["0x7861f80"]); // 4 years
      expect(await xpower.miningDifficulty(await block("timestamp"))).to.eq(0);
    });
    it("should return amount=3 (at difficulty=0)", async function () {
      const hash = table.getHash({ amount: 3 }); // w.r.t. difficulty=0
      expect(hash).to.be.a("string").and.to.match(/^0x00/);
      const amount = await xpower.amountOf(hash);
      expect(amount.toBigInt()).to.eq(3n * UNUM);
    });
    it("should return difficulty=0", async function () {
      await network.provider.send("hardhat_mine", ["0x7861f80"]); // 4 years
      expect(await xpower.miningDifficulty(await block("timestamp"))).to.eq(0);
    });
    it("should return amount=0 (at difficulty=0)", async function () {
      const hash = table.getHash({ amount: 0 }); // w.r.t. difficulty=0
      expect(hash).to.be.a("string").and.to.match(/^0x/);
      const amount = await xpower.amountOf(hash);
      expect(amount.toBigInt()).to.eq(0n);
    });
  });
});
async function block(field) {
  const latest = await ethers.provider.getBlock("latest");
  return latest[field];
}
