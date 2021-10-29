/* eslint no-unused-expressions: [off] */
const { expect } = require("chai");
const { ethers } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contract
let xpower; // instance

const { HashTable } = require("./hash-table");
let table; // pre-hashed nonces

before(async function () {
  accounts = await ethers.getSigners();
  expect(accounts.length).to.be.greaterThan(0);
  addresses = accounts.map((acc) => acc.address);
  expect(addresses.length).to.be.greaterThan(0);
});
before(async function () {
  const factory = await ethers.getContractFactory("XPowerTest");
  const contract = await factory.deploy();
  table = await new HashTable(contract).init(addresses[0]);
});
before(async function () {
  XPower = await ethers.getContractFactory("XPowerTest");
});
beforeEach(async function () {
  xpower = await XPower.deploy();
  await xpower.deployed();
  await xpower.transferOwnership(addresses[1]);
});
describe("XPowerTest", async function () {
  it("should return interval>0", async function () {
    const interval = await xpower.interval();
    expect(interval.toNumber()).to.be.greaterThan(0);
  });
  it("should return deadline>=0", async function () {
    const deadline = await xpower.deadline();
    expect(deadline.toNumber()).to.be.greaterThanOrEqual(0);
  });
  it("should return deadline<3600", async function () {
    const deadline = await xpower.deadline();
    expect(deadline.toNumber()).to.be.lessThan(3600);
  });
});
describe("XPowerTest", async function () {
  const hash =
    "0x46700b4d40ac5c35af2c22dda2787a91eb567b06c924a8fb8ae9a05b20c08c21";
  const address = "0x0000000000000000000000000000000000000000";
  const interval = 0;
  const nonce = 0;
  it("should return hash(0, 0x000..000, 0)=0x467..c21", async function () {
    expect(await xpower.hash(nonce, address, interval)).to.eq(hash);
  });
  it("should return amount(0x467..c21)=0", async function () {
    expect(await xpower.amount(hash)).to.eq(0);
  });
  it("should return zeros(0x467..c21)=0", async function () {
    expect(await xpower.zeros(hash)).to.eq(0);
  });
});
describe("XPowerTest", async function () {
  const hash =
    "0x0ef62733b9f5c16ca72a7c13a15589ab786ab316db5793e2aa150295e2d55765";
  const address = "0x0000000000000000000000000000000000000000";
  const interval = 0;
  const nonce = 66;
  it("should return hash(66, 0x000..000, 0)=0x0ef..765", async function () {
    expect(await xpower.hash(nonce, address, interval)).to.eq(hash);
  });
  it("should return amount(0x0ef..765)=1", async function () {
    expect(await xpower.amount(hash)).to.eq(1);
  });
  it("should return zeros(0x0ef..765)=1", async function () {
    expect(await xpower.zeros(hash)).to.eq(1);
  });
});
describe("XPowerTest", async function () {
  const hash =
    "0x001f977ff1a39944b0cca004a83101e0691e20564b4fc5b7f24f6986409d07bd";
  const address = "0x0000000000000000000000000000000000000000";
  const interval = 0;
  const nonce = 16;
  it("should return hash(16, 0x000..000, 0)=0x001..7bd", async function () {
    expect(await xpower.hash(nonce, address, interval)).to.eq(hash);
  });
  it("should return amount(0x001..7bd)=3", async function () {
    expect(await xpower.amount(hash)).to.eq(3);
  });
  it("should return zeros(0x001..7bd)=2", async function () {
    expect(await xpower.zeros(hash)).to.eq(2);
  });
});
describe("XPowerTest", async function () {
  it(`should hash for amount=0`, async function () {
    const interval = await xpower.interval();
    expect(interval.toNumber()).to.be.greaterThan(0);
    const nonce = table.getNonce({ amount: 0 });
    expect(nonce).to.greaterThanOrEqual(0);
    const hash = await xpower.hash(nonce, addresses[0], interval);
    expect(hash).to.be.a("string").and.to.match(/^0x/);
    expect(hash).to.equal(table.getHash({ amount: 0 }));
  });
  it(`should hash for amount=1`, async function () {
    const interval = await xpower.interval();
    expect(interval.toNumber()).to.be.greaterThan(0);
    const nonce = table.getNonce({ amount: 1 });
    expect(nonce).to.greaterThanOrEqual(0);
    const hash = await xpower.hash(nonce, addresses[0], interval);
    expect(hash).to.be.a("string").and.to.match(/^0x/);
    expect(hash).to.equal(table.getHash({ amount: 1 }));
  });
  it(`should hash for amount=3`, async function () {
    const interval = await xpower.interval();
    expect(interval.toNumber()).to.be.greaterThan(0);
    const nonce = table.getNonce({ amount: 3 });
    expect(nonce).to.greaterThanOrEqual(0);
    const hash = await xpower.hash(nonce, addresses[0], interval);
    expect(hash).to.be.a("string").and.to.match(/^0x/);
    expect(hash).to.equal(table.getHash({ amount: 3 }));
  });
});
describe("XPowerTest", async function () {
  it("should return amount=0", async function () {
    const hash = table.getHash({ amount: 0 });
    expect(hash).to.be.a("string").and.to.match(/^0x/);
    const amount = await xpower.amount(hash);
    expect(amount).to.equal(0);
  });
  it("should return amount=1", async function () {
    const hash = table.getHash({ amount: 1 });
    expect(hash).to.be.a("string").and.to.match(/^0x/);
    const amount = await xpower.amount(hash);
    expect(amount).to.equal(1);
  });
  it("should return amount=3", async function () {
    const hash = table.getHash({ amount: 3 });
    expect(hash).to.be.a("string").and.to.match(/^0x/);
    const amount = await xpower.amount(hash);
    expect(amount).to.equal(3);
  });
});
describe("XPowerTest", async function () {
  it("should return zeros=0", async function () {
    expect(
      await xpower.zeros(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(0);
    expect(
      await xpower.zeros(
        "0xf0ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(0);
    expect(
      await xpower.zeros(
        "0xf00fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(0);
  });
  it("should return zeros=1 for 0x0f..", async function () {
    expect(
      await xpower.zeros(
        "0x0fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(1);
    expect(
      await xpower.zeros(
        "0x0f0fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(1);
    expect(
      await xpower.zeros(
        "0x0f00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(1);
  });
  it("should return zeros=1 for 0x0e..", async function () {
    expect(
      await xpower.zeros(
        "0x0effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(1);
  });
  it("should return zeros=1 for 0x0d..", async function () {
    expect(
      await xpower.zeros(
        "0x0dffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(1);
  });
  it("should return zeros=1 for 0x0c..", async function () {
    expect(
      await xpower.zeros(
        "0x0cffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(1);
  });
  it("should return zeros=1 for 0x0b..", async function () {
    expect(
      await xpower.zeros(
        "0x0bffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(1);
  });
  it("should return zeros=1 for 0x0a..", async function () {
    expect(
      await xpower.zeros(
        "0x0affffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(1);
  });
  it("should return zeros=1 for 0x09..", async function () {
    expect(
      await xpower.zeros(
        "0x09ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(1);
  });
  it("should return zeros=1 for 0x08..", async function () {
    expect(
      await xpower.zeros(
        "0x08ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(1);
  });
  it("should return zeros=1 for 0x07..", async function () {
    expect(
      await xpower.zeros(
        "0x07ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(1);
  });
  it("should return zeros=1 for 0x06..", async function () {
    expect(
      await xpower.zeros(
        "0x06ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(1);
  });
  it("should return zeros=1 for 0x05..", async function () {
    expect(
      await xpower.zeros(
        "0x05ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(1);
  });
  it("should return zeros=1 for 0x04..", async function () {
    expect(
      await xpower.zeros(
        "0x04ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(1);
  });
  it("should return zeros=1 for 0x03..", async function () {
    expect(
      await xpower.zeros(
        "0x03ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(1);
  });
  it("should return zeros=1 for 0x02..", async function () {
    expect(
      await xpower.zeros(
        "0x02ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(1);
  });
  it("should return zeros=1 for 0x01..", async function () {
    expect(
      await xpower.zeros(
        "0x01ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(1);
  });
  it("should return zeros=2", async function () {
    expect(
      await xpower.zeros(
        "0x00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(2);
  });
  it("should return zeros=3", async function () {
    expect(
      await xpower.zeros(
        "0x000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(3);
  });
  it("should return zeros=4", async function () {
    expect(
      await xpower.zeros(
        "0x0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(4);
  });
  it("should return zeros=5", async function () {
    expect(
      await xpower.zeros(
        "0x00000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(5);
  });
  it("should return zeros=6", async function () {
    expect(
      await xpower.zeros(
        "0x000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(6);
  });
  it("should return zeros=7", async function () {
    expect(
      await xpower.zeros(
        "0x0000000fffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(7);
  });
  it("should return zeros=8", async function () {
    expect(
      await xpower.zeros(
        "0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(8);
  });
  it("should return zeros=9", async function () {
    expect(
      await xpower.zeros(
        "0x000000000fffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(9);
  });
  it("should return zeros=10", async function () {
    expect(
      await xpower.zeros(
        "0x0000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(10);
  });
  it("should return zeros=11", async function () {
    expect(
      await xpower.zeros(
        "0x00000000000fffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(11);
  });
  it("should return zeros=12", async function () {
    expect(
      await xpower.zeros(
        "0x000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(12);
  });
  it("should return zeros=13", async function () {
    expect(
      await xpower.zeros(
        "0x0000000000000fffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(13);
  });
  it("should return zeros=14", async function () {
    expect(
      await xpower.zeros(
        "0x00000000000000ffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(14);
  });
  it("should return zeros=15", async function () {
    expect(
      await xpower.zeros(
        "0x000000000000000fffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(15);
  });
  it("should return zeros=16", async function () {
    expect(
      await xpower.zeros(
        "0x0000000000000000ffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ).to.equal(16);
  });
  it("should return zeros=32", async function () {
    expect(
      await xpower.zeros(
        "0x00000000000000000000000000000000ffffffffffffffffffffffffffffffff"
      )
    ).to.equal(32);
  });
  it("should return zeros=64", async function () {
    expect(
      await xpower.zeros(
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      )
    ).to.equal(64);
  });
});
