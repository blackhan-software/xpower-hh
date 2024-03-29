const { ethers, network } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Sov, Nft, Ppt, Mty, Nty; // contract
let moe, sov, nft, ppt, mty, nty; // instance

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
const MONTH = 2_629_800; // [seconds]

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
    moe = await Moe.deploy([], 0);
    expect(moe).to.be.an("object");
    await moe.init();
    sov = await Sov.deploy(moe.target, [], 0);
    expect(sov).to.be.an("object");
  });
  before(async function () {
    nft = await Nft.deploy(moe.target, NFT_XPOW_URL, [], 0);
    expect(nft).to.be.an("object");
    ppt = await Ppt.deploy(NFT_XPOW_URL, [], 0);
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
  describe("grant-role", async function () {
    it("should grant reparametrization right", async function () {
      await mty.grantRole(mty.APB_ROLE(), addresses[0]);
    });
  });
  describe("set-apb", async function () {
    it("should reparameterize at 0.010000[%] (per nft.year)", async function () {
      const tx = await mty.setAPBBatch([202103], [0, 1, 0.01e6, 256]);
      expect(tx).be.an("object");
    });
    it("should forward time by one month", async function () {
      await network.provider.send("evm_increaseTime", [MONTH]);
      await network.provider.send("evm_mine", []);
    });
  });
  describe("set-apb", async function () {
    it("should reparameterize at 0.020000[%] (per nft.year)", async function () {
      const tx = await mty.setAPBBatch([202103], [0, 1, 0.02e6, 256]);
      expect(tx).be.an("object");
    });
    for (let m = 1; m <= 24 * 4; m++) {
      it("should print current & target values", async function () {
        const nft_id = await nft.idBy(new Date().getFullYear() - 1, 3);
        const tgt = await mty.apbTargetOf(nft_id);
        const apb = await mty.apbOf(nft_id);
        console.debug("[APB]", m, apb, tgt);
      });
      it("should forward time by one month", async function () {
        await network.provider.send("evm_increaseTime", [MONTH / 4]);
        await network.provider.send("evm_mine", []);
      });
    }
  });
});
