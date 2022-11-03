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

describe("Supervised", async function () {
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
    await xpower.init();
  });
  before(async function () {
    apower = await APower.deploy(NONE_ADDRESS, xpower.address, DEADLINE);
    expect(apower).to.exist;
    await apower.deployed();
  });
  it("should revoke & grant ALPHA_ADMIN_ROLE", async function () {
    const role = await has_role(apower.ALPHA_ADMIN_ROLE(), {
      has: true,
    });
    await revoke_role(role, { revoked: true });
    await grant_role(role, { granted: true });
  });
  it("should revoke & grant GAMMA_ADMIN_ROLE", async function () {
    const role = await has_role(apower.GAMMA_ADMIN_ROLE(), {
      has: true,
    });
    await revoke_role(role, { revoked: true });
    await grant_role(role, { granted: true });
  });
  it("should revoke & grant DELTA_ADMIN_ROLE", async function () {
    const role = await has_role(apower.DELTA_ADMIN_ROLE(), {
      has: true,
    });
    await revoke_role(role, { revoked: true });
    await grant_role(role, { granted: true });
  });
  it("should revoke & grant THETA_ADMIN_ROLE", async function () {
    const role = await has_role(apower.THETA_ADMIN_ROLE(), {
      has: true,
    });
    await revoke_role(role, { revoked: true });
    await grant_role(role, { granted: true });
  });
  it("should revoke & grant MOE_SEAL_ADMIN_ROLE", async function () {
    const role = await has_role(apower.MOE_SEAL_ADMIN_ROLE(), {
      has: true,
    });
    await revoke_role(role, { revoked: true });
    await grant_role(role, { granted: true });
  });
  it("should revoke & grant SOV_SEAL_ADMIN_ROLE", async function () {
    const role = await has_role(apower.SOV_SEAL_ADMIN_ROLE(), {
      has: true,
    });
    await revoke_role(role, { revoked: true });
    await grant_role(role, { granted: true });
  });
  it("should revoke & grant NFT_SEAL_ADMIN_ROLE", async function () {
    const role = await has_role(apower.NFT_SEAL_ADMIN_ROLE(), {
      has: true,
    });
    await revoke_role(role, { revoked: true });
    await grant_role(role, { granted: true });
  });
  it("should revoke & grant URI_DATA_ADMIN_ROLE", async function () {
    const role = await has_role(apower.URI_DATA_ADMIN_ROLE(), {
      has: true,
    });
    await revoke_role(role, { revoked: true });
    await grant_role(role, { granted: true });
  });
  it("should transfer DEFAULT_ADMIN_ROLE", async function () {
    const role = await has_role(apower.DEFAULT_ADMIN_ROLE(), {
      has: true,
    });
    await grant_role(role, { granted: true, address: addresses[1] });
    await has_role(role, { has: true, address: addresses[1] });
    await revoke_role(role, { revoked: true });
    await grant_role(role, { granted: false });
  });
  it("should renounce DEFAULT_ADMIN_ROLE", async function () {
    const role = await has_role(apower.DEFAULT_ADMIN_ROLE(), {
      has: true,
      address: addresses[1],
    });
    const signers = await ethers.getSigners();
    expect(signers.length).to.be.gte(2);
    await apower.connect(signers[1]).renounceRole(role, addresses[1]);
    await has_role(role, { has: false, address: addresses[1] });
  });
  it("should grant & revoke ALPHA_ROLE", async function () {
    const role = await has_role(apower.ALPHA_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: true });
    await revoke_role(role, { revoked: true });
  });
  it("should grant & revoke GAMMA_ROLE", async function () {
    const role = await has_role(apower.GAMMA_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: true });
    await revoke_role(role, { revoked: true });
  });
  it("should grant & revoke DELTA_ROLE", async function () {
    const role = await has_role(apower.DELTA_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: true });
    await revoke_role(role, { revoked: true });
  });
  it("should grant & revoke THETA_ROLE", async function () {
    const role = await has_role(apower.THETA_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: true });
    await revoke_role(role, { revoked: true });
  });
  it("should grant & revoke MOE_SEAL_ROLE", async function () {
    const role = await has_role(apower.MOE_SEAL_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: true });
    await revoke_role(role, { revoked: true });
  });
  it("should grant & revoke SOV_SEAL_ROLE", async function () {
    const role = await has_role(apower.SOV_SEAL_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: true });
    await revoke_role(role, { revoked: true });
  });
  it("should grant & revoke NFT_SEAL_ROLE", async function () {
    const role = await has_role(apower.NFT_SEAL_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: true });
    await revoke_role(role, { revoked: true });
  });
  it("should grant & revoke URI_DATA_ROLE", async function () {
    const role = await has_role(apower.URI_DATA_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: true });
    await revoke_role(role, { revoked: true });
  });
  it("should renounce ALPHA_ADMIN_ROLE", async function () {
    const role = await has_role(apower.ALPHA_ADMIN_ROLE(), {
      has: true,
    });
    await apower.renounceRole(role, addresses[0]);
    await has_role(role, { has: false });
  });
  it("should not grant ALPHA_ROLE", async function () {
    const role = await has_role(apower.ALPHA_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: false });
  });
  it("should renounce GAMMA_ADMIN_ROLE", async function () {
    const role = await has_role(apower.GAMMA_ADMIN_ROLE(), {
      has: true,
    });
    await apower.renounceRole(role, addresses[0]);
    await has_role(role, { has: false });
  });
  it("should not grant GAMMA_ROLE", async function () {
    const role = await has_role(apower.GAMMA_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: false });
  });
  it("should renounce DELTA_ADMIN_ROLE", async function () {
    const role = await has_role(apower.DELTA_ADMIN_ROLE(), {
      has: true,
    });
    await apower.renounceRole(role, addresses[0]);
    await has_role(role, { has: false });
  });
  it("should not grant DELTA_ROLE", async function () {
    const role = await has_role(apower.DELTA_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: false });
  });
  it("should renounce THETA_ADMIN_ROLE", async function () {
    const role = await has_role(apower.THETA_ADMIN_ROLE(), {
      has: true,
    });
    await apower.renounceRole(role, addresses[0]);
    await has_role(role, { has: false });
  });
  it("should not grant THETA_ROLE", async function () {
    const role = await has_role(apower.THETA_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: false });
  });
  it("should renounce MOE_SEAL_ADMIN_ROLE", async function () {
    const role = await has_role(apower.MOE_SEAL_ADMIN_ROLE(), {
      has: true,
    });
    await apower.renounceRole(role, addresses[0]);
    await has_role(role, { has: false });
  });
  it("should not grant MOE_SEAL_ROLE", async function () {
    const role = await has_role(apower.MOE_SEAL_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: false });
  });
  it("should renounce SOV_SEAL_ADMIN_ROLE", async function () {
    const role = await has_role(apower.SOV_SEAL_ADMIN_ROLE(), {
      has: true,
    });
    await apower.renounceRole(role, addresses[0]);
    await has_role(role, { has: false });
  });
  it("should not grant SOV_SEAL_ROLE", async function () {
    const role = await has_role(apower.SOV_SEAL_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: false });
  });
  it("should renounce NFT_SEAL_ADMIN_ROLE", async function () {
    const role = await has_role(apower.NFT_SEAL_ADMIN_ROLE(), {
      has: true,
    });
    await apower.renounceRole(role, addresses[0]);
    await has_role(role, { has: false });
  });
  it("should not grant NFT_SEAL_ROLE", async function () {
    const role = await has_role(apower.NFT_SEAL_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: false });
  });
  it("should renounce URI_DATA_ADMIN_ROLE", async function () {
    const role = await has_role(apower.URI_DATA_ADMIN_ROLE(), {
      has: true,
    });
    await apower.renounceRole(role, addresses[0]);
    await has_role(role, { has: false });
  });
  it("should not grant URI_DATA_ROLE", async function () {
    const role = await has_role(apower.URI_DATA_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: false });
  });
  describe("supportsInterface", function () {
    it("should support IERC165 interface", async function () {
      expect(await apower.supportsInterface(0x01ffc9a7)).to.eq(true);
    });
    it("should support IAccessControl interface", async function () {
      expect(await apower.supportsInterface(0x7965db0b)).to.eq(true);
    });
  });
});
async function revoke_role(role, { revoked, address }) {
  await apower.revokeRole(role, address ?? addresses[0]);
  await has_role(role, { has: !revoked });
}
async function grant_role(role, { granted, address }) {
  if (granted) {
    await apower.grantRole(role, address ?? addresses[0]);
  } else {
    await apower.grantRole(role, address ?? addresses[0]).catch((ex) => {
      const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
      if (m === null) console.debug(ex);
      expect(m).to.be.not.null;
    });
  }
  await has_role(role, { has: granted, address });
}
async function has_role(role, { has, address }) {
  const my_role = await role;
  const has_role = await apower.hasRole(my_role, address ?? addresses[0]);
  expect(has_role).to.eq(has);
  return my_role;
}
