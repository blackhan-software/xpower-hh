/* eslint no-unused-expressions: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contract
let xpower; // instance

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

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
    const factory = await ethers.getContractFactory("XPowerLokiTest");
    const contract = await factory.deploy(NONE_ADDRESS, DEADLINE);
    table = await new HashTable(contract, addresses[0]).init();
  });
  before(async function () {
    XPower = await ethers.getContractFactory("XPowerLokiTest");
  });
  beforeEach(async function () {
    xpower = await XPower.deploy(NONE_ADDRESS, DEADLINE);
    await xpower.deployed();
    await xpower.init();
  });
  describe("difficulty", async function () {
    it("should return difficulty=0", async function () {
      expect(await xpower.difficultyFor(await block("timestamp"))).to.eq(0);
    });
    it("should return amount=0 (at difficulty=0)", async function () {
      const hash = table.getHash({ amount: 0 }); // w.r.t. difficulty=0
      expect(hash).to.be.a("string").and.to.match(/^0x/);
      const amount = await xpower.amountOf(hash);
      expect(amount).to.eq(0);
    });
    it("should return difficulty=1", async function () {
      await network.provider.send("hardhat_mine", ["0x7861f80"]); // 4 years
      expect(await xpower.difficultyFor(await block("timestamp"))).to.eq(1);
    });
    it("should return amount=0 (at difficulty=1)", async function () {
      const hash = table.getHash({ amount: 1 }); // w.r.t. difficulty=0
      expect(hash).to.be.a("string").and.to.match(/^0x0/);
      const amount = await xpower.amountOf(hash);
      expect(amount).to.eq(0);
    });
    it("should return difficulty=2", async function () {
      await network.provider.send("hardhat_mine", ["0x7861f80"]); // 4 years
      expect(await xpower.difficultyFor(await block("timestamp"))).to.eq(2);
    });
    it("should return amount=0 (at difficulty=2)", async function () {
      const hash = table.getHash({ amount: 3 }); // w.r.t. difficulty=0
      expect(hash).to.be.a("string").and.to.match(/^0x00/);
      const amount = await xpower.amountOf(hash);
      expect(amount).to.eq(0);
    });
    it("should return difficulty=3", async function () {
      await network.provider.send("hardhat_mine", ["0x7861f80"]); // 4 years
      expect(await xpower.difficultyFor(await block("timestamp"))).to.eq(3);
    });
    it("should return amount=0 (at difficulty=3)", async function () {
      const hash = table.getHash({ amount: 0 }); // w.r.t. difficulty=0
      expect(hash).to.be.a("string").and.to.match(/^0x/);
      const amount = await xpower.amountOf(hash);
      expect(amount).to.eq(0);
    });
  });
});
async function block(field) {
  const latest = await ethers.provider.getBlock("latest");
  return latest[field];
}
