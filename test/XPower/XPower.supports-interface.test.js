const { ethers } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe; // contract
let moe; // instance

describe("XPower", async function () {
  before(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
    addresses = accounts.map((acc) => acc.address);
    expect(addresses.length).to.be.greaterThan(1);
  });
  before(async function () {
    Moe = await ethers.getContractFactory("XPowerTest");
    expect(Moe).to.be.an("object");
  });
  before(async function () {
    moe = await Moe.deploy([], 0);
    expect(moe).to.be.an("object");
  });
  describe("supportsInterface", function () {
    it("should support IERC165 interface", async function () {
      expect(await moe.supportsInterface("0x01ffc9a7")).to.eq(true);
    });
    it("should support IERC20 interface", async function () {
      expect(await moe.supportsInterface("0x36372b07")).to.eq(true);
    });
    it("should support IERC20Metadata interface", async function () {
      expect(await moe.supportsInterface("0xa219a025")).to.eq(true);
    });
    it("should support IAccessControl interface", async function () {
      expect(await moe.supportsInterface("0x7965db0b")).to.eq(true);
    });
    it("should support IAccessControlEnumerable interface", async function () {
      expect(await moe.supportsInterface("0x5a05180f")).to.eq(true);
    });
  });
});
