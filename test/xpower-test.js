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
  expect(addresses.length).to.be.greaterThan(1);
});
before(async function () {
  const factory = await ethers.getContractFactory("XPowerTest");
  const contract = await factory.deploy();
  table = await new HashTable(contract).init(addresses[0]);
});
before(async function () {
  XPower = await ethers.getContractFactory("XPower");
});
beforeEach(async function () {
  xpower = await XPower.deploy();
  await xpower.deployed();
  await xpower.transferOwnership(addresses[1]);
});
describe("XPower", async function () {
  it("should *not* mint for amount=0", async function () {
    const nonce = table.getNonce({ amount: 0 });
    expect(nonce).to.greaterThanOrEqual(0);
    const tx = await xpower.mint(nonce).catch((ex) => {
      expect(ex.message.match(/empty nonce-hash/)).to.be.not.null;
    });
    expect(tx).to.eq(undefined);
    expect(await xpower.balanceOf(addresses[0])).to.eq(0);
    expect(await xpower.balanceOf(addresses[1])).to.eq(0);
  });
  it("should mint for amount=1", async function () {
    const nonce = table.getNonce({ amount: 1 });
    expect(nonce).to.greaterThanOrEqual(0);
    const tx = await xpower.mint(nonce);
    expect(tx).to.be.an("object");
    expect(await xpower.balanceOf(addresses[0])).to.eq(1);
    expect(await xpower.balanceOf(addresses[1])).to.eq(0);
  });
  it("should mint for amount=1 once", async function () {
    const nonce = table.getNonce({ amount: 1 });
    expect(nonce).to.greaterThanOrEqual(0);
    const tx_1st = await xpower.mint(nonce);
    expect(tx_1st).to.be.an("object");
    expect(await xpower.balanceOf(addresses[0])).to.eq(1);
    expect(await xpower.balanceOf(addresses[1])).to.eq(0);
    const tx_2nd = await xpower.mint(nonce).catch((ex) => {
      expect(ex.message.match(/duplicate nonce-hash/)).to.be.not.null;
    });
    expect(tx_2nd).to.eq(undefined);
    expect(await xpower.balanceOf(addresses[0])).to.eq(1);
    expect(await xpower.balanceOf(addresses[1])).to.eq(0);
  });
  it("should mint for amount=3", async function () {
    const nonce = table.getNonce({ amount: 3 });
    expect(nonce).to.greaterThanOrEqual(0);
    const tx = await xpower.mint(nonce);
    expect(tx).to.be.an("object");
    expect(await xpower.balanceOf(addresses[0])).to.eq(3);
    expect(await xpower.balanceOf(addresses[1])).to.eq(1);
  });
  it("should mint for amount=3 once", async function () {
    const nonce = table.getNonce({ amount: 3 });
    expect(nonce).to.greaterThanOrEqual(0);
    const tx_1 = await xpower.mint(nonce);
    expect(tx_1).to.be.an("object");
    expect(await xpower.balanceOf(addresses[0])).to.eq(3);
    expect(await xpower.balanceOf(addresses[1])).to.eq(1);
    const tx_2nd = await xpower.mint(nonce).catch((ex) => {
      expect(ex.message.match(/duplicate nonce-hash/)).to.be.not.null;
    });
    expect(tx_2nd).to.eq(undefined);
    expect(await xpower.balanceOf(addresses[0])).to.eq(3);
    expect(await xpower.balanceOf(addresses[1])).to.eq(1);
  });
});
describe("XPower", async function () {
  it("should *not* mint for amount=0 & *not* burn 1 token", async function () {
    const nonce = table.getNonce({ amount: 0 });
    expect(nonce).to.greaterThanOrEqual(0);
    const tx_mint = await xpower.mint(nonce).catch((ex) => {
      expect(ex.message.match(/empty nonce-hash/)).to.be.not.null;
    });
    expect(tx_mint).to.eq(undefined);
    expect(await xpower.balanceOf(addresses[0])).to.eq(0);
    expect(await xpower.balanceOf(addresses[1])).to.eq(0);
    const tx_burn = await xpower.burn(1).catch((ex) => {
      expect(ex.message.match(/burn amount exceeds balance/)).to.be.not.null;
    });
    expect(tx_burn).to.eq(undefined);
    expect(await xpower.balanceOf(addresses[0])).to.eq(0);
    expect(await xpower.balanceOf(addresses[1])).to.eq(0);
  });
  it("should *not* mint for amount=0 & *not* burn 2 tokens", async function () {
    const nonce = table.getNonce({ amount: 0 });
    expect(nonce).to.greaterThanOrEqual(0);
    const tx_mint = await xpower.mint(nonce).catch((ex) => {
      expect(ex.message.match(/empty nonce-hash/)).to.be.not.null;
    });
    expect(tx_mint).to.eq(undefined);
    expect(await xpower.balanceOf(addresses[0])).to.eq(0);
    expect(await xpower.balanceOf(addresses[1])).to.eq(0);
    const tx_burn = await xpower.burn(2).catch((ex) => {
      expect(ex.message.match(/burn amount exceeds balance/)).to.be.not.null;
    });
    expect(tx_burn).to.eq(undefined);
    expect(await xpower.balanceOf(addresses[0])).to.eq(0);
    expect(await xpower.balanceOf(addresses[1])).to.eq(0);
  });
  it("should mint for amount=1 & burn 1 token", async function () {
    const nonce = table.getNonce({ amount: 1 });
    expect(nonce).to.greaterThanOrEqual(0);
    const tx = await xpower.mint(nonce);
    expect(tx).to.be.an("object");
    expect(await xpower.balanceOf(addresses[0])).to.eq(1);
    expect(await xpower.balanceOf(addresses[1])).to.eq(0);
    await xpower.burn(1);
    expect(await xpower.balanceOf(addresses[0])).to.eq(0);
    expect(await xpower.balanceOf(addresses[1])).to.eq(0);
  });
  it("should mint for amount=3 & burn 2 tokens", async function () {
    const nonce = table.getNonce({ amount: 3 });
    expect(nonce).to.greaterThanOrEqual(0);
    const tx = await xpower.mint(nonce);
    expect(tx).to.be.an("object");
    expect(await xpower.balanceOf(addresses[0])).to.eq(3);
    expect(await xpower.balanceOf(addresses[1])).to.eq(1);
    await xpower.burn(2);
    expect(await xpower.balanceOf(addresses[0])).to.eq(1);
    expect(await xpower.balanceOf(addresses[1])).to.eq(1);
  });
});
