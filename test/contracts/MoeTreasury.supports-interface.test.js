/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let APower, XPower; // contracts
let apower, xpower; // instances
let Nft, NftStaked, NftTreasury; // contracts
let nft, nft_staked, nft_treasury; // instances
let MoeTreasury; // contracts
let moe_treasury, mt; // instances

const NFT_ODIN_URL = "https://xpowermine.com/nfts/odin/{id}.json";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years

describe("MoeTreasury", async function () {
  beforeEach(async function () {
    await network.provider.send("hardhat_reset");
  });
  beforeEach(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
    addresses = accounts.map((acc) => acc.address);
    expect(addresses.length).to.be.greaterThan(1);
  });
  beforeEach(async function () {
    APower = await ethers.getContractFactory("APowerOdin");
    expect(APower).to.exist;
    XPower = await ethers.getContractFactory("XPowerOdinTest");
    expect(XPower).to.exist;
  });
  beforeEach(async function () {
    Nft = await ethers.getContractFactory("XPowerOdinNft");
    expect(Nft).to.exist;
    NftStaked = await ethers.getContractFactory("XPowerOdinNftStaked");
    expect(NftStaked).to.exist;
    NftTreasury = await ethers.getContractFactory("NftTreasury");
    expect(NftTreasury).to.exist;
    MoeTreasury = await ethers.getContractFactory("MoeTreasury");
    expect(MoeTreasury).to.exist;
  });
  beforeEach(async function () {
    xpower = await XPower.deploy([], DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
  });
  beforeEach(async function () {
    apower = await APower.deploy(xpower.address, [], DEADLINE);
    expect(apower).to.exist;
    await apower.deployed();
  });
  beforeEach(async function () {
    nft = await Nft.deploy(NFT_ODIN_URL, xpower.address, [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
  });
  beforeEach(async function () {
    nft_staked = await NftStaked.deploy(NFT_ODIN_URL, [], DEADLINE);
    expect(nft_staked).to.exist;
    await nft_staked.deployed();
  });
  beforeEach(async function () {
    nft_treasury = await NftTreasury.deploy(nft.address, nft_staked.address);
    expect(nft_treasury).to.exist;
    await nft_treasury.deployed();
  });
  beforeEach(async function () {
    moe_treasury = await MoeTreasury.deploy(
      apower.address,
      xpower.address,
      nft_staked.address
    );
    expect(moe_treasury).to.exist;
    await moe_treasury.deployed();
    mt = moe_treasury;
  });
  describe("supportsInterface", function () {
    it("should support IERC165 interface", async function () {
      expect(await mt.supportsInterface(0x01ffc9a7)).to.eq(true);
    });
    it("should support IAccessControl interface", async function () {
      expect(await mt.supportsInterface(0x7965db0b)).to.eq(true);
    });
    it("should support IAccessControlEnumerable interface", async function () {
      expect(await mt.supportsInterface(0x5a05180f)).to.eq(true);
    });
  });
});
