const { ethers, network } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Sov, Nft, Ppt, Mty, Nty; // contracts
let moe, sov, nft, ppt, mty, nty; // instances

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years

describe("MoeTreasury", async function () {
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
    expect(Moe).to.be.an("object");
    Sov = await ethers.getContractFactory("APower");
    expect(Sov).to.be.an("object");
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.be.an("object");
    Ppt = await ethers.getContractFactory("XPowerPpt");
    expect(Ppt).to.be.an("object");
    Mty = await ethers.getContractFactory("MoeTreasury");
    expect(Mty).to.be.an("object");
    Nty = await ethers.getContractFactory("NftTreasury");
    expect(Nty).to.be.an("object");
  });
  before(async function () {
    moe = await Moe.deploy([], DEADLINE);
    expect(moe).to.be.an("object");
    await moe.init();
    sov = await Sov.deploy(moe.target, [], DEADLINE);
    expect(sov).to.be.an("object");
  });
  before(async function () {
    nft = await Nft.deploy(moe.target, NFT_XPOW_URL, [], DEADLINE);
    expect(nft).to.be.an("object");
    ppt = await Ppt.deploy(NFT_XPOW_URL, [], DEADLINE);
    expect(ppt).to.be.an("object");
  });
  before(async function () {
    mty = await Mty.deploy(moe.target, sov.target, ppt.target);
    expect(mty).to.be.an("object");
    nty = await Nty.deploy(nft.target, ppt.target, mty.target);
    expect(nty).to.be.an("object");
  });
  before(async function () {
    await sov.transferOwnership(mty.target);
    expect(await sov.owner()).to.eq(mty.target);
  });
  describe("apr-target (i.e rewards ~ nft-level)", async function () {
    it("should return 0[%] for nft-level=00", async function () {
      expect(await mty.aprTargetOf(202100)).to.eq(0x0);
      expect(await mty.aprTargetOf(202200)).to.eq(0x0);
      expect(await mty.aprTargetOf(202300)).to.eq(0x0);
    });
    it("should return 1[%] for nft-level=03", async function () {
      expect(await mty.aprTargetOf(202103)).to.eq(1e6);
      expect(await mty.aprTargetOf(202203)).to.eq(1e6);
      expect(await mty.aprTargetOf(202303)).to.eq(1e6);
    });
    it("should return 2[%] for nft-level=06", async function () {
      expect(await mty.aprTargetOf(202106)).to.eq(2e6);
      expect(await mty.aprTargetOf(202206)).to.eq(2e6);
      expect(await mty.aprTargetOf(202306)).to.eq(2e6);
    });
    it("should return 3[%] for nft-level=09", async function () {
      expect(await mty.aprTargetOf(202109)).to.eq(3e6);
      expect(await mty.aprTargetOf(202209)).to.eq(3e6);
      expect(await mty.aprTargetOf(202309)).to.eq(3e6);
    });
    it("should return 4[%] for nft-level=12", async function () {
      expect(await mty.aprTargetOf(202112)).to.eq(4e6);
      expect(await mty.aprTargetOf(202212)).to.eq(4e6);
      expect(await mty.aprTargetOf(202312)).to.eq(4e6);
    });
    it("should return 5[%] for nft-level=15", async function () {
      expect(await mty.aprTargetOf(202115)).to.eq(5e6);
      expect(await mty.aprTargetOf(202215)).to.eq(5e6);
      expect(await mty.aprTargetOf(202315)).to.eq(5e6);
    });
    it("should return 6[%] for nft-level=18", async function () {
      expect(await mty.aprTargetOf(202118)).to.eq(6e6);
      expect(await mty.aprTargetOf(202218)).to.eq(6e6);
      expect(await mty.aprTargetOf(202318)).to.eq(6e6);
    });
    it("should return 7[%] for nft-level=21", async function () {
      expect(await mty.aprTargetOf(202121)).to.eq(7e6);
      expect(await mty.aprTargetOf(202221)).to.eq(7e6);
      expect(await mty.aprTargetOf(202321)).to.eq(7e6);
    });
    it("should return 8[%] for nft-level=24", async function () {
      expect(await mty.aprTargetOf(202124)).to.eq(8e6);
      expect(await mty.aprTargetOf(202224)).to.eq(8e6);
      expect(await mty.aprTargetOf(202324)).to.eq(8e6);
    });
  });
});
