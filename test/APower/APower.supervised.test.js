const { ethers } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Sov; // contract
let moe, sov; // instance

describe("APowerSupervised", async function () {
  before(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
    addresses = accounts.map((acc) => acc.address);
    expect(addresses.length).to.be.greaterThan(1);
  });
  before(async function () {
    Moe = await ethers.getContractFactory("XPowerTest");
    expect(Moe).to.be.an("object");
    Sov = await ethers.getContractFactory("APower");
    expect(Sov).to.be.an("object");
  });
  before(async function () {
    moe = await Moe.deploy([], 0);
    expect(moe).to.be.an("object");
    await moe.init();
    sov = await Sov.deploy(moe.target, [], 0);
    expect(sov).to.be.an("object");
  });
  it("should grant & revoke SOV_SEAL_ROLE", async function () {
    const role = await has_role(sov.SOV_SEAL_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: true });
    await revoke_role(role, { revoked: true });
  });
  it("should revoke & grant SOV_SEAL_ADMIN_ROLE", async function () {
    const role = await has_role(sov.SOV_SEAL_ADMIN_ROLE(), {
      has: true,
    });
    await revoke_role(role, { revoked: true });
    await grant_role(role, { granted: true });
  });
  it("should transfer DEFAULT_ADMIN_ROLE", async function () {
    const role = await has_role(sov.DEFAULT_ADMIN_ROLE(), {
      has: true,
    });
    await grant_role(role, { granted: true, address: addresses[1] });
    await has_role(role, { has: true, address: addresses[1] });
    await revoke_role(role, { revoked: true });
    await grant_role(role, { granted: false });
  });
});
async function revoke_role(role, { revoked, address }) {
  await sov.revokeRole(role, address ?? addresses[0]);
  await has_role(role, { has: !revoked });
}
async function grant_role(role, { granted, address }) {
  if (granted) {
    await sov.grantRole(role, address ?? addresses[0]);
  } else {
    await sov.grantRole(role, address ?? addresses[0]).catch((ex) => {
      const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
      if (m === null) console.debug(ex);
      expect(m).to.not.eq(null);
    });
  }
  await has_role(role, { has: granted, address });
}
async function has_role(role, { has, address }) {
  const my_role = await role;
  const has_role = await sov.hasRole(my_role, address ?? addresses[0]);
  expect(has_role).to.eq(has);
  return my_role;
}
