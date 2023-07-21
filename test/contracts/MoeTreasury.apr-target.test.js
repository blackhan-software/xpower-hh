/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

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
    expect(Moe).to.exist;
    Sov = await ethers.getContractFactory("APower");
    expect(Sov).to.exist;
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.exist;
    Ppt = await ethers.getContractFactory("XPowerPpt");
    expect(Ppt).to.exist;
    Mty = await ethers.getContractFactory("MoeTreasury");
    expect(Mty).to.exist;
    Nty = await ethers.getContractFactory("NftTreasury");
    expect(Nty).to.exist;
  });
  before(async function () {
    moe = await Moe.deploy([], DEADLINE);
    expect(moe).to.exist;
    await moe.deployed();
    await moe.init();
    sov = await Sov.deploy(moe.address, [], DEADLINE);
    expect(sov).to.exist;
    await sov.deployed();
  });
  before(async function () {
    nft = await Nft.deploy(moe.address, NFT_XPOW_URL, [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
    ppt = await Ppt.deploy(NFT_XPOW_URL, [], DEADLINE);
    expect(ppt).to.exist;
    await ppt.deployed();
  });
  before(async function () {
    mty = await Mty.deploy(moe.address, sov.address, ppt.address);
    expect(mty).to.exist;
    await mty.deployed();
    nty = await Nty.deploy(nft.address, ppt.address, mty.address);
    expect(nty).to.exist;
    await nty.deployed();
  });
  before(async function () {
    await sov.transferOwnership(mty.address);
    expect(await sov.owner()).to.eq(mty.address);
  });
  describe("apr-target (i.e rewards ~ nft-level)", async function () {
    it("should return 0.000000[%] for nft-level=00", async function () {
      expect(await mty.aprTargetOf(1202100)).to.eq(0x000_000);
      expect(await mty.aprTargetOf(1202200)).to.eq(0x000_000);
      expect(await mty.aprTargetOf(1202300)).to.eq(0x000_000);
    });
    it("should return 1.000000[%] for nft-level=03", async function () {
      expect(await mty.aprTargetOf(1202103)).to.eq(1_000_000);
      expect(await mty.aprTargetOf(1202203)).to.eq(1_000_000);
      expect(await mty.aprTargetOf(1202303)).to.eq(1_000_000);
    });
    it("should return 2.000000[%] for nft-level=06", async function () {
      expect(await mty.aprTargetOf(1202106)).to.eq(2_000_000);
      expect(await mty.aprTargetOf(1202206)).to.eq(2_000_000);
      expect(await mty.aprTargetOf(1202306)).to.eq(2_000_000);
    });
    it("should return 3.000000[%] for nft-level=09", async function () {
      expect(await mty.aprTargetOf(1202109)).to.eq(3_000_000);
      expect(await mty.aprTargetOf(1202209)).to.eq(3_000_000);
      expect(await mty.aprTargetOf(1202309)).to.eq(3_000_000);
    });
    it("should return 4.000000[%] for nft-level=12", async function () {
      expect(await mty.aprTargetOf(1202112)).to.eq(4_000_000);
      expect(await mty.aprTargetOf(1202212)).to.eq(4_000_000);
      expect(await mty.aprTargetOf(1202312)).to.eq(4_000_000);
    });
    it("should return 5.000000[%] for nft-level=15", async function () {
      expect(await mty.aprTargetOf(1202115)).to.eq(5_000_000);
      expect(await mty.aprTargetOf(1202215)).to.eq(5_000_000);
      expect(await mty.aprTargetOf(1202315)).to.eq(5_000_000);
    });
    it("should return 6.000000[%] for nft-level=18", async function () {
      expect(await mty.aprTargetOf(1202118)).to.eq(6_000_000);
      expect(await mty.aprTargetOf(1202218)).to.eq(6_000_000);
      expect(await mty.aprTargetOf(1202318)).to.eq(6_000_000);
    });
    it("should return 7.000000[%] for nft-level=21", async function () {
      expect(await mty.aprTargetOf(1202121)).to.eq(7_000_000);
      expect(await mty.aprTargetOf(1202221)).to.eq(7_000_000);
      expect(await mty.aprTargetOf(1202321)).to.eq(7_000_000);
    });
    it("should return 8.000000[%] for nft-level=24", async function () {
      expect(await mty.aprTargetOf(1202124)).to.eq(8_000_000);
      expect(await mty.aprTargetOf(1202224)).to.eq(8_000_000);
      expect(await mty.aprTargetOf(1202324)).to.eq(8_000_000);
    });
  });
  describe("rate-target (i.e rewards ~ nft-level)", async function () {
    it("should return 0.++++++[%] for nft-level=00", async function () {
      expect(await mty.rateTargetOf(1202100)).to.gte(0x000_000);
      expect(await mty.rateTargetOf(1202200)).to.gte(0x000_000);
      expect(await mty.rateTargetOf(1202300)).to.gte(0x000_000);
    });
    it("should return 1.++++++[%] for nft-level=03", async function () {
      expect(await mty.rateTargetOf(1202103)).to.gte(1_000_000);
      expect(await mty.rateTargetOf(1202203)).to.gte(1_000_000);
      expect(await mty.rateTargetOf(1202303)).to.gte(1_000_000);
    });
    it("should return 2.++++++[%] for nft-level=06", async function () {
      expect(await mty.rateTargetOf(1202106)).to.gte(2_000_000);
      expect(await mty.rateTargetOf(1202206)).to.gte(2_000_000);
      expect(await mty.rateTargetOf(1202306)).to.gte(2_000_000);
    });
    it("should return 3.++++++[%] for nft-level=09", async function () {
      expect(await mty.rateTargetOf(1202109)).to.gte(3_000_000);
      expect(await mty.rateTargetOf(1202209)).to.gte(3_000_000);
      expect(await mty.rateTargetOf(1202309)).to.gte(3_000_000);
    });
    it("should return 4.++++++[%] for nft-level=12", async function () {
      expect(await mty.rateTargetOf(1202112)).to.gte(4_000_000);
      expect(await mty.rateTargetOf(1202212)).to.gte(4_000_000);
      expect(await mty.rateTargetOf(1202312)).to.gte(4_000_000);
    });
    it("should return 5.++++++[%] for nft-level=15", async function () {
      expect(await mty.rateTargetOf(1202115)).to.gte(5_000_000);
      expect(await mty.rateTargetOf(1202215)).to.gte(5_000_000);
      expect(await mty.rateTargetOf(1202315)).to.gte(5_000_000);
    });
    it("should return 6.++++++[%] for nft-level=18", async function () {
      expect(await mty.rateTargetOf(1202118)).to.gte(6_000_000);
      expect(await mty.rateTargetOf(1202218)).to.gte(6_000_000);
      expect(await mty.rateTargetOf(1202318)).to.gte(6_000_000);
    });
    it("should return 7.++++++[%] for nft-level=21", async function () {
      expect(await mty.rateTargetOf(1202121)).to.gte(7_000_000);
      expect(await mty.rateTargetOf(1202221)).to.gte(7_000_000);
      expect(await mty.rateTargetOf(1202321)).to.gte(7_000_000);
    });
    it("should return 8.++++++[%] for nft-level=24", async function () {
      expect(await mty.rateTargetOf(1202124)).to.gte(8_000_000);
      expect(await mty.rateTargetOf(1202224)).to.gte(8_000_000);
      expect(await mty.rateTargetOf(1202324)).to.gte(8_000_000);
    });
  });
});
