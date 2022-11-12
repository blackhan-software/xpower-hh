/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower, Nft, NftStaked; // contracts
let xpower, nft, nft_staked; // instances

const NFT_ODIN_URL = "https://xpowermine.com/nfts/odin/{id}.json";
const NONE_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years

describe("XPowerNftStakedSupervised", async function () {
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
    XPower = await ethers.getContractFactory("XPowerOdinTest");
    expect(XPower).to.exist;
  });
  before(async function () {
    Nft = await ethers.getContractFactory("XPowerOdinNft");
    expect(Nft).to.exist;
    NftStaked = await ethers.getContractFactory("XPowerOdinNftStaked");
    expect(NftStaked).to.exist;
  });
  before(async function () {
    xpower = await XPower.deploy(NONE_ADDRESS, DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
  });
  before(async function () {
    nft = await Nft.deploy(
      NONE_ADDRESS,
      xpower.address,
      NFT_ODIN_URL,
      DEADLINE
    );
    expect(nft).to.exist;
    await nft.deployed();
  });
  before(async function () {
    nft_staked = await NftStaked.deploy(NONE_ADDRESS, NFT_ODIN_URL, DEADLINE);
    expect(nft_staked).to.exist;
    await nft_staked.deployed();
  });
  it("should grant & revoke NFT_SEAL_ROLE", async function () {
    const role = await has_role(nft_staked.NFT_SEAL_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: true });
    await revoke_role(role, { revoked: true });
  });
  it("should revoke & grant NFT_SEAL_ADMIN_ROLE", async function () {
    const role = await has_role(nft_staked.NFT_SEAL_ADMIN_ROLE(), {
      has: true,
    });
    await revoke_role(role, { revoked: true });
    await grant_role(role, { granted: true });
  });
  it("should grant & revoke URI_DATA_ROLE", async function () {
    const role = await has_role(nft_staked.URI_DATA_ROLE(), {
      has: false,
    });
    await grant_role(role, { granted: true });
    await revoke_role(role, { revoked: true });
  });
  it("should revoke & grant URI_DATA_ADMIN_ROLE", async function () {
    const role = await has_role(nft_staked.URI_DATA_ADMIN_ROLE(), {
      has: true,
    });
    await revoke_role(role, { revoked: true });
    await grant_role(role, { granted: true });
  });
  it("should transfer DEFAULT_ADMIN_ROLE", async function () {
    const role = await has_role(nft_staked.DEFAULT_ADMIN_ROLE(), {
      has: true,
    });
    await grant_role(role, { granted: true, address: addresses[1] });
    await has_role(role, { has: true, address: addresses[1] });
    await revoke_role(role, { revoked: true });
    await grant_role(role, { granted: false });
  });
});
async function revoke_role(role, { revoked, address }) {
  await nft_staked.revokeRole(role, address ?? addresses[0]);
  await has_role(role, { has: !revoked });
}
async function grant_role(role, { granted, address }) {
  if (granted) {
    await nft_staked.grantRole(role, address ?? addresses[0]);
  } else {
    await nft_staked.grantRole(role, address ?? addresses[0]).catch((ex) => {
      const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
      if (m === null) console.debug(ex);
      expect(m).to.be.not.null;
    });
  }
  await has_role(role, { has: granted, address });
}
async function has_role(role, { has, address }) {
  const my_role = await role;
  const has_role = await nft_staked.hasRole(my_role, address ?? addresses[0]);
  expect(has_role).to.eq(has);
  return my_role;
}
