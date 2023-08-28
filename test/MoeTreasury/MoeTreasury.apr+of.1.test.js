const { ethers, network } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Sov, Nft, Ppt, Mty, Nty; // contract
let moe, sov, nft, ppt, mty, nty; // instance

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
const YEAR = 365.25 * 86_400; // [seconds]
const FULL_YEAR = new Date().getFullYear();
const AGE2 = FULL_YEAR - 2; // 2 years ago

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
  describe("apb-of (i.e rewards ~ nft-level)", async function () {
    it("should return 0.020000[%] for nft-level=00", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 0))).to.eq(0.02e6);
    });
    it("should return 0.020000[%] for nft-level=03", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 3))).to.eq(0.02e6);
    });
    it("should return 0.020000[%] for nft-level=06", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 6))).to.eq(0.02e6);
    });
    it("should return 0.020000[%] for nft-level=09", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 9))).to.eq(0.02e6);
    });
    it("should return 0.020000[%] for nft-level=12", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 12))).to.eq(0.02e6);
    });
    it("should return 0.020000[%] for nft-level=15", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 15))).to.eq(0.02e6);
    });
    it("should return 0.020000[%] for nft-level=18", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 18))).to.eq(0.02e6);
    });
    it("should return 0.020000[%] for nft-level=21", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 21))).to.eq(0.02e6);
    });
    it("should return 0.020000[%] for nft-level=24", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 24))).to.eq(0.02e6);
    });
  });
  describe("set-apr: **init** at 0.010000[%]", async function () {
    it("should reparameterize", async function () {
      await mty.grantRole(mty.APB_ROLE(), addresses[0]);
      expect(await mty.setAPB(202103, [0, 1, 10_000, 256])).to.not.eq(
        undefined,
      );
    });
  });
  describe("set-apb (double from 0.010000[%] to 0.020000[%])", async function () {
    it("should forward time by one year", async function () {
      await network.provider.send("evm_increaseTime", [YEAR]);
      await network.provider.send("evm_mine", []);
    });
    it("should *not* reparameterize (too large)", async function () {
      await mty.grantRole(mty.APB_ROLE(), addresses[0]);
      expect(
        await mty.setAPB(202103, [0, 1, 0.02e6 + 1, 256]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too large)", async function () {
      await mty.grantRole(mty.APB_ROLE(), addresses[0]);
      expect(
        await mty.setAPB(202103, [0.03e6 + 1, 1, 0.01e6, 256]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too small)", async function () {
      await mty.grantRole(mty.APB_ROLE(), addresses[0]);
      expect(
        await mty.setAPB(202103, [0, 1, 0.004999e6, 256]).catch((ex) => {
          const m = ex.message.match(/invalid change: too small/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
    it("should reparameterize", async function () {
      await mty.grantRole(mty.APB_ROLE(), addresses[0]);
      expect(await mty.setAPB(202103, [0, 1, 0.02e6, 256])).to.not.eq(
        undefined,
      );
    });
    it("should *not* reparameterize (too frequent)", async function () {
      await mty.grantRole(mty.APB_ROLE(), addresses[0]);
      expect(
        await mty.setAPB(202103, [0, 1, 0.01e6, 256]).catch((ex) => {
          const m = ex.message.match(/invalid change: too frequent/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
  });
  describe("apb-of (i.e rewards ~ nft-level × time)", async function () {
    it("should forward time by one year", async function () {
      await network.provider.send("evm_increaseTime", [YEAR]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.054999[%] for nft-level=00", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 0))).to.eq(0.054999e6);
    });
    it("should return 0.054999[%] for nft-level=03", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 3))).to.eq(0.054999e6);
    });
    it("should return 0.054999[%] for nft-level=06", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 6))).to.eq(0.054999e6);
    });
    it("should return 0.054999[%] for nft-level=09", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 9))).to.eq(0.054999e6);
    });
    it("should return 0.054999[%] for nft-level=12", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 12))).to.eq(0.054999e6);
    });
    it("should return 0.054999[%] for nft-level=15", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 15))).to.eq(0.054999e6);
    });
    it("should return 0.054999[%] for nft-level=18", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 18))).to.eq(0.054999e6);
    });
    it("should return 0.054999[%] for nft-level=21", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 21))).to.eq(0.054999e6);
    });
    it("should return 0.054999[%] for nft-level=24", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 24))).to.eq(0.054999e6);
    });
  });
  describe("apb-of (i.e rewards ~ nft-level × time)", async function () {
    it("should forward time by one year", async function () {
      await network.provider.send("evm_increaseTime", [YEAR]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.076666[%] for nft-level=00", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 0))).to.eq(0.076666e6);
    });
    it("should return 0.076666[%] for nft-level=03", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 3))).to.eq(0.076666e6);
    });
    it("should return 0.076666[%] for nft-level=06", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 6))).to.eq(0.076666e6);
    });
    it("should return 0.076666[%] for nft-level=09", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 9))).to.eq(0.076666e6);
    });
    it("should return 0.076666[%] for nft-level=12", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 12))).to.eq(0.076666e6);
    });
    it("should return 0.076666[%] for nft-level=15", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 15))).to.eq(0.076666e6);
    });
    it("should return 0.076666[%] for nft-level=18", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 18))).to.eq(0.076666e6);
    });
    it("should return 0.076666[%] for nft-level=21", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 21))).to.eq(0.076666e6);
    });
    it("should return 0.076666[%] for nft-level=24", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 24))).to.eq(0.076666e6);
    });
  });
  describe("apb-of (i.e rewards ~ nft-level × time)", async function () {
    it("should forward time by one year", async function () {
      await network.provider.send("evm_increaseTime", [YEAR]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.097499[%] for nft-level=00", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 0))).to.eq(0.097499e6);
    });
    it("should return 0.097499[%] for nft-level=03", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 3))).to.eq(0.097499e6);
    });
    it("should return 0.097499[%] for nft-level=06", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 6))).to.eq(0.097499e6);
    });
    it("should return 0.097499[%] for nft-level=09", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 9))).to.eq(0.097499e6);
    });
    it("should return 0.097499[%] for nft-level=12", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 12))).to.eq(0.097499e6);
    });
    it("should return 0.097499[%] for nft-level=15", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 15))).to.eq(0.097499e6);
    });
    it("should return 0.097499[%] for nft-level=18", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 18))).to.eq(0.097499e6);
    });
    it("should return 0.097499[%] for nft-level=21", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 21))).to.eq(0.097499e6);
    });
    it("should return 0.097499[%] for nft-level=24", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 24))).to.eq(0.097499e6);
    });
  });
  describe("apb-of (i.e rewards ~ nft-level × time)", async function () {
    it("should forward time by 997 years", async function () {
      await network.provider.send("evm_increaseTime", [YEAR * 999]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 20.079990[%] for nft-level=00", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 0))).to.eq(20.07999e6);
    });
    it("should return 20.079990[%] for nft-level=03", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 3))).to.eq(20.07999e6);
    });
    it("should return 20.079990[%] for nft-level=06", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 6))).to.eq(20.07999e6);
    });
    it("should return 20.079990[%] for nft-level=09", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 9))).to.eq(20.07999e6);
    });
    it("should return 20.079990[%] for nft-level=12", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 12))).to.eq(20.07999e6);
    });
    it("should return 20.079990[%] for nft-level=15", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 15))).to.eq(20.07999e6);
    });
    it("should return 20.079990[%] for nft-level=18", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 18))).to.eq(20.07999e6);
    });
    it("should return 20.079990[%] for nft-level=21", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 21))).to.eq(20.07999e6);
    });
    it("should return 20.079990[%] for nft-level=24", async function () {
      expect(await mty.apbOf(ppt.idBy(AGE2, 24))).to.eq(20.07999e6);
    });
  });
});
