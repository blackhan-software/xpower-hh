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

describe("XPowerTest", async function () {
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
  before(async function () {
    xpower = await XPower.deploy(NONE_ADDRESS, DEADLINE);
    await xpower.deployed();
    await xpower.init();
  });
  describe("interval", async function () {
    it("should return interval>0", async function () {
      const interval = await xpower.interval();
      expect(interval.toNumber()).to.be.greaterThan(0);
    });
  });
  describe("hash w/block-hash", async function () {
    it("should hash for amount=0", async function () {
      const interval = await xpower.interval();
      expect(interval.toNumber()).to.be.greaterThan(0);
      const [nonce, block_hash] = table.getNonce({ amount: 0 });
      expect(nonce.gte(0)).to.eq(true);
      const hash = await xpower.hashOf(
        addresses[0],
        interval,
        block_hash,
        nonce
      );
      expect(hash).to.be.a("string").and.to.match(/^0x/);
      expect(hash).to.equal(table.getHash({ amount: 0 }));
    });
    it("should hash for amount=1", async function () {
      const interval = await xpower.interval();
      expect(interval.toNumber()).to.be.greaterThan(0);
      const [nonce, block_hash] = table.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const hash = await xpower.hashOf(
        addresses[0],
        interval,
        block_hash,
        nonce
      );
      expect(hash).to.be.a("string").and.to.match(/^0x/);
      expect(hash).to.equal(table.getHash({ amount: 1 }));
    });
    it("should hash for amount=3", async function () {
      const interval = await xpower.interval();
      expect(interval.toNumber()).to.be.greaterThan(0);
      const [nonce, block_hash] = table.getNonce({ amount: 3 });
      expect(nonce.gte(0)).to.eq(true);
      const hash = await xpower.hashOf(
        addresses[0],
        interval,
        block_hash,
        nonce
      );
      expect(hash).to.be.a("string").and.to.match(/^0x/);
      expect(hash).to.equal(table.getHash({ amount: 3 }));
    });
  });
  describe("amount", async function () {
    it("should return amount=0", async function () {
      const hash = table.getHash({ amount: 0 });
      expect(hash).to.be.a("string").and.to.match(/^0x/);
      const amount = await xpower.amountOf(hash);
      expect(amount).to.equal(0);
    });
    it("should return amount=1", async function () {
      const hash = table.getHash({ amount: 1 });
      expect(hash).to.be.a("string").and.to.match(/^0x/);
      const amount = await xpower.amountOf(hash);
      expect(amount).to.equal(1);
    });
    it("should return amount=3", async function () {
      const hash = table.getHash({ amount: 3 });
      expect(hash).to.be.a("string").and.to.match(/^0x/);
      const amount = await xpower.amountOf(hash);
      expect(amount).to.equal(3);
    });
  });
  describe("zeros (for amounts={0,1,3})", async function () {
    it("should return amount=0", async function () {
      const hash = table.getHash({ amount: 0 });
      expect(await xpower.amountOf(hash)).to.eq(0);
    });
    it("should return zeros=0", async function () {
      const hash = table.getHash({ amount: 0 });
      expect(await xpower.zerosOf(hash)).to.eq(0);
    });
    it("should return amount=1", async function () {
      const hash = table.getHash({ amount: 1 });
      expect(await xpower.amountOf(hash)).to.eq(1);
    });
    it("should return zeros=1", async function () {
      const hash = table.getHash({ amount: 1 });
      expect(await xpower.zerosOf(hash)).to.eq(1);
    });
    it("should return amount=3", async function () {
      const hash = table.getHash({ amount: 3 });
      expect(await xpower.amountOf(hash)).to.eq(3);
    });
    it("should return zeros=2", async function () {
      const hash = table.getHash({ amount: 3 });
      expect(await xpower.zerosOf(hash)).to.eq(2);
    });
  });
  describe("zeros", async function () {
    it("should return zeros=0", async function () {
      expect(
        await xpower.zerosOf(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(0);
      expect(
        await xpower.zerosOf(
          "0xf0ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(0);
      expect(
        await xpower.zerosOf(
          "0xf00fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(0);
    });
    it("should return zeros=1 for 0x0f..", async function () {
      expect(
        await xpower.zerosOf(
          "0x0fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(1);
      expect(
        await xpower.zerosOf(
          "0x0f0fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(1);
      expect(
        await xpower.zerosOf(
          "0x0f00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(1);
    });
    it("should return zeros=1 for 0x0e..", async function () {
      expect(
        await xpower.zerosOf(
          "0x0effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(1);
    });
    it("should return zeros=1 for 0x0d..", async function () {
      expect(
        await xpower.zerosOf(
          "0x0dffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(1);
    });
    it("should return zeros=1 for 0x0c..", async function () {
      expect(
        await xpower.zerosOf(
          "0x0cffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(1);
    });
    it("should return zeros=1 for 0x0b..", async function () {
      expect(
        await xpower.zerosOf(
          "0x0bffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(1);
    });
    it("should return zeros=1 for 0x0a..", async function () {
      expect(
        await xpower.zerosOf(
          "0x0affffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(1);
    });
    it("should return zeros=1 for 0x09..", async function () {
      expect(
        await xpower.zerosOf(
          "0x09ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(1);
    });
    it("should return zeros=1 for 0x08..", async function () {
      expect(
        await xpower.zerosOf(
          "0x08ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(1);
    });
    it("should return zeros=1 for 0x07..", async function () {
      expect(
        await xpower.zerosOf(
          "0x07ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(1);
    });
    it("should return zeros=1 for 0x06..", async function () {
      expect(
        await xpower.zerosOf(
          "0x06ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(1);
    });
    it("should return zeros=1 for 0x05..", async function () {
      expect(
        await xpower.zerosOf(
          "0x05ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(1);
    });
    it("should return zeros=1 for 0x04..", async function () {
      expect(
        await xpower.zerosOf(
          "0x04ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(1);
    });
    it("should return zeros=1 for 0x03..", async function () {
      expect(
        await xpower.zerosOf(
          "0x03ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(1);
    });
    it("should return zeros=1 for 0x02..", async function () {
      expect(
        await xpower.zerosOf(
          "0x02ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(1);
    });
    it("should return zeros=1 for 0x01..", async function () {
      expect(
        await xpower.zerosOf(
          "0x01ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(1);
    });
    it("should return zeros=2", async function () {
      expect(
        await xpower.zerosOf(
          "0x00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(2);
    });
    it("should return zeros=3", async function () {
      expect(
        await xpower.zerosOf(
          "0x000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(3);
    });
    it("should return zeros=4", async function () {
      expect(
        await xpower.zerosOf(
          "0x0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(4);
    });
    it("should return zeros=5", async function () {
      expect(
        await xpower.zerosOf(
          "0x00000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(5);
    });
    it("should return zeros=6", async function () {
      expect(
        await xpower.zerosOf(
          "0x000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(6);
    });
    it("should return zeros=7", async function () {
      expect(
        await xpower.zerosOf(
          "0x0000000fffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(7);
    });
    it("should return zeros=8", async function () {
      expect(
        await xpower.zerosOf(
          "0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(8);
    });
    it("should return zeros=9", async function () {
      expect(
        await xpower.zerosOf(
          "0x000000000fffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(9);
    });
    it("should return zeros=10", async function () {
      expect(
        await xpower.zerosOf(
          "0x0000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(10);
    });
    it("should return zeros=11", async function () {
      expect(
        await xpower.zerosOf(
          "0x00000000000fffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(11);
    });
    it("should return zeros=12", async function () {
      expect(
        await xpower.zerosOf(
          "0x000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(12);
    });
    it("should return zeros=13", async function () {
      expect(
        await xpower.zerosOf(
          "0x0000000000000fffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(13);
    });
    it("should return zeros=14", async function () {
      expect(
        await xpower.zerosOf(
          "0x00000000000000ffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(14);
    });
    it("should return zeros=15", async function () {
      expect(
        await xpower.zerosOf(
          "0x000000000000000fffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(15);
    });
    it("should return zeros=16", async function () {
      expect(
        await xpower.zerosOf(
          "0x0000000000000000ffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      ).to.equal(16);
    });
    it("should return zeros=32", async function () {
      expect(
        await xpower.zerosOf(
          "0x00000000000000000000000000000000ffffffffffffffffffffffffffffffff"
        )
      ).to.equal(32);
    });
    it("should return zeros=64", async function () {
      expect(
        await xpower.zerosOf(
          "0x0000000000000000000000000000000000000000000000000000000000000000"
        )
      ).to.equal(64);
    });
  });
});
