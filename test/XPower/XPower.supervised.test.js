const { ethers } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contract
let xpower; // instance

describe("XPowerSupervised", async function () {
  before(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
    addresses = accounts.map((acc) => acc.address);
    expect(addresses.length).to.be.greaterThan(1);
  });
  before(async function () {
    XPower = await ethers.getContractFactory("XPowerTest");
    expect(XPower).to.be.an("object");
  });
  before(async function () {
    xpower = await XPower.deploy([], 0);
    expect(xpower).to.be.an("object");
    await xpower.init();
  });
  it("should grant & revoke MOE_SEAL_ROLE", async function () {
    const role = await has_role(xpower.MOE_SEAL_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: true });
    await revoke_role(role, { revoked: true });
  });
  it("should revoke & grant MOE_SEAL_ADMIN_ROLE", async function () {
    const role = await has_role(xpower.MOE_SEAL_ADMIN_ROLE(), {
      has: true,
    });
    await revoke_role(role, { revoked: true });
    await grant_role(role, { granted: true });
  });
  it("should transfer DEFAULT_ADMIN_ROLE", async function () {
    const role = await has_role(xpower.DEFAULT_ADMIN_ROLE(), {
      has: true,
    });
    await grant_role(role, { granted: true, address: addresses[1] });
    await has_role(role, { has: true, address: addresses[1] });
    await revoke_role(role, { revoked: true });
    await grant_role(role, { granted: false });
  });
});
async function revoke_role(role, { revoked, address }) {
  await xpower.revokeRole(role, address ?? addresses[0]);
  await has_role(role, { has: !revoked });
}
async function grant_role(role, { granted, address }) {
  if (granted) {
    await xpower.grantRole(role, address ?? addresses[0]);
  } else {
    await xpower.grantRole(role, address ?? addresses[0]).catch((ex) => {
      const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
      if (m === null) console.debug(ex);
      expect(m).to.not.eq(null);
    });
  }
  await has_role(role, { has: granted, address });
}
async function has_role(role, { has, address }) {
  const my_role = await role;
  const has_role = await xpower.hasRole(my_role, address ?? addresses[0]);
  expect(has_role).to.eq(has);
  return my_role;
}
