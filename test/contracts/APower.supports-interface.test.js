/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Sov; // contracts
let moe, sov; // instances

const DEADLINE = 126_230_400; // [seconds] i.e. 4 years

describe("APower", async function () {
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
    Moe = await ethers.getContractFactory("XPowerTest");
    expect(Moe).to.exist;
    Sov = await ethers.getContractFactory("APower");
    expect(Sov).to.exist;
  });
  before(async function () {
    moe = await Moe.deploy([], DEADLINE);
    expect(moe).to.exist;
    await moe.deployed();
    sov = await Sov.deploy(moe.address, [], DEADLINE);
    expect(sov).to.exist;
    await sov.deployed();
  });
  describe("supportsInterface", function () {
    it("should support IERC165 interface", async function () {
      expect(await sov.supportsInterface(0x01ffc9a7)).to.eq(true);
    });
    it("should support IERC20 interface", async function () {
      expect(await sov.supportsInterface(0x36372b07)).to.eq(true);
    });
    it("should support IERC20Metadata interface", async function () {
      expect(await sov.supportsInterface(0xa219a025)).to.eq(true);
    });
    it("should support IAccessControl interface", async function () {
      expect(await sov.supportsInterface(0x7965db0b)).to.eq(true);
    });
    it("should support IAccessControlEnumerable interface", async function () {
      expect(await sov.supportsInterface(0x5a05180f)).to.eq(true);
    });
  });
});
