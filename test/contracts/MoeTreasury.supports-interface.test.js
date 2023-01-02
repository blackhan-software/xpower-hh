/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let AThor, XThor, ALoki, XLoki, AOdin, XOdin; // contracts
let athor, xthor, aloki, xloki, aodin, xodin; // instances
let Nft, Ppt, NftTreasury; // contracts
let nft, ppt, nft_treasury; // instances
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
    AThor = await ethers.getContractFactory("APowerThor");
    expect(AThor).to.exist;
    XThor = await ethers.getContractFactory("XPowerThorTest");
    expect(XThor).to.exist;
    ALoki = await ethers.getContractFactory("APowerLoki");
    expect(ALoki).to.exist;
    XLoki = await ethers.getContractFactory("XPowerLokiTest");
    expect(XLoki).to.exist;
    AOdin = await ethers.getContractFactory("APowerOdin");
    expect(AOdin).to.exist;
    XOdin = await ethers.getContractFactory("XPowerOdinTest");
    expect(XOdin).to.exist;
  });
  beforeEach(async function () {
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.exist;
    Ppt = await ethers.getContractFactory("XPowerPpt");
    expect(Ppt).to.exist;
    NftTreasury = await ethers.getContractFactory("NftTreasury");
    expect(NftTreasury).to.exist;
    MoeTreasury = await ethers.getContractFactory("MoeTreasury");
    expect(MoeTreasury).to.exist;
  });
  beforeEach(async function () {
    xthor = await XThor.deploy([], DEADLINE);
    expect(xthor).to.exist;
    await xthor.deployed();
    await xthor.init();
    xloki = await XLoki.deploy([], DEADLINE);
    expect(xloki).to.exist;
    await xloki.deployed();
    await xloki.init();
    xodin = await XOdin.deploy([], DEADLINE);
    expect(xodin).to.exist;
    await xodin.deployed();
    await xodin.init();
  });
  beforeEach(async function () {
    athor = await AThor.deploy(xthor.address, [], DEADLINE);
    expect(athor).to.exist;
    await athor.deployed();
    aloki = await ALoki.deploy(xloki.address, [], DEADLINE);
    expect(aloki).to.exist;
    await aloki.deployed();
    aodin = await AOdin.deploy(xodin.address, [], DEADLINE);
    expect(aodin).to.exist;
    await aodin.deployed();
  });
  beforeEach(async function () {
    nft = await Nft.deploy(NFT_ODIN_URL, [xodin.address], [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
  });
  beforeEach(async function () {
    ppt = await Ppt.deploy(NFT_ODIN_URL, [], DEADLINE);
    expect(ppt).to.exist;
    await ppt.deployed();
  });
  beforeEach(async function () {
    nft_treasury = await NftTreasury.deploy(nft.address, ppt.address);
    expect(nft_treasury).to.exist;
    await nft_treasury.deployed();
  });
  beforeEach(async function () {
    moe_treasury = await MoeTreasury.deploy(
      [xthor.address, xloki.address, xodin.address],
      [athor.address, aloki.address, aodin.address],
      ppt.address
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
