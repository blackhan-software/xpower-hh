/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let APower, XPower; // contracts
let apower, xpower; // instances

const NONE_ADDRESS = "0x0000000000000000000000000000000000000000";
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
    APower = await ethers.getContractFactory("APowerOdin");
    expect(APower).to.exist;
    XPower = await ethers.getContractFactory("XPowerOdinTest");
    expect(XPower).to.exist;
  });
  before(async function () {
    xpower = await XPower.deploy(NONE_ADDRESS, DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
  });
  before(async function () {
    apower = await APower.deploy(NONE_ADDRESS, xpower.address, DEADLINE);
    expect(apower).to.exist;
    await apower.deployed();
  });
  describe("supportsInterface", function () {
    it("should support IERC165 interface", async function () {
      expect(await apower.supportsInterface(0x01ffc9a7)).to.eq(true);
    });
    it("should support IERC20 interface", async function () {
      expect(await apower.supportsInterface(0x36372b07)).to.eq(true);
    });
    it("should support IERC20Metadata interface", async function () {
      expect(await apower.supportsInterface(0xa219a025)).to.eq(true);
    });
    it("should support IAccessControl interface", async function () {
      expect(await apower.supportsInterface(0x7965db0b)).to.eq(true);
    });
    it("should support IAccessControlEnumerable interface", async function () {
      expect(await apower.supportsInterface(0x5a05180f)).to.eq(true);
    });
  });
});
