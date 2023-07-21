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
const DAYS = 86_400; // [seconds]

const FULL_YEAR = new Date().getFullYear();
const YEAR = FULL_YEAR - 2; // 2 years ago

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
    mty = mty = await Mty.deploy(moe.address, sov.address, ppt.address);
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
  describe("bonuses-length", async function () {
    it("should return a list of length=0", async function () {
      expect(await mty.bonusesLength(202103)).to.eq(0);
      expect(await mty.bonusesLength(202106)).to.eq(0);
      expect(await mty.bonusesLength(202109)).to.eq(0);
    });
  });
  describe("apr-bonus-of (i.e rewards ~ nft-level)", async function () {
    it("should return 0.020000[%] for nft-level=00", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 0))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=03", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 3))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=06", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 6))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=09", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 9))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=12", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 12))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=15", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 15))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=18", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 18))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=21", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 21))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=24", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 24))).to.eq(20_000);
    });
  });
  describe("set-apr-bonus (double from 0.010000[%] to 0.020000[%])", async function () {
    it(`should forward time by one year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
      await network.provider.send("evm_mine", []);
    });
    it("should *not* reparameterize (too large)", async function () {
      await mty.grantRole(mty.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await mty.setAPRBonus(202103, [0, 1, 20_001]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too large)", async function () {
      await mty.grantRole(mty.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await mty.setAPRBonus(202103, [30_001, 1, 10_000]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too small)", async function () {
      await mty.grantRole(mty.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await mty.setAPRBonus(202103, [0, 1, 4_000]).catch((ex) => {
          const m = ex.message.match(/invalid change: too small/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should reparameterize", async function () {
      await mty.grantRole(mty.APR_BONUS_ROLE(), addresses[0]);
      expect(await mty.setAPRBonus(202103, [0, 1, 20_000])).to.not.eq(
        undefined
      );
    });
    it("should *not* reparameterize (too frequent)", async function () {
      await mty.grantRole(mty.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await mty.setAPRBonus(202103, [0, 1, 10_000]).catch((ex) => {
          const m = ex.message.match(/invalid change: too frequent/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("apr-bonus-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by one year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.080000[%] for nft-level=00", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 0))).to.eq(80_000);
    });
    it("should return 0.080000[%] for nft-level=03", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 3))).to.eq(80_000);
    });
    it("should return 0.080000[%] for nft-level=06", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 6))).to.eq(80_000);
    });
    it("should return 0.080000[%] for nft-level=09", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 9))).to.eq(80_000);
    });
    it("should return 0.080000[%] for nft-level=12", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 12))).to.eq(80_000);
    });
    it("should return 0.080000[%] for nft-level=15", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 15))).to.eq(80_000);
    });
    it("should return 0.080000[%] for nft-level=18", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 18))).to.eq(80_000);
    });
    it("should return 0.080000[%] for nft-level=21", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 21))).to.eq(80_000);
    });
    it("should return 0.080000[%] for nft-level=24", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 24))).to.eq(80_000);
    });
  });
  describe("apr-bonus-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by one year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.100000[%] for nft-level=00", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 0))).to.eq(100_000);
    });
    it("should return 0.100000[%] for nft-level=03", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 3))).to.eq(100_000);
    });
    it("should return 0.100000[%] for nft-level=06", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 6))).to.eq(100_000);
    });
    it("should return 0.100000[%] for nft-level=09", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 9))).to.eq(100_000);
    });
    it("should return 0.100000[%] for nft-level=12", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 12))).to.eq(100_000);
    });
    it("should return 0.100000[%] for nft-level=15", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 15))).to.eq(100_000);
    });
    it("should return 0.100000[%] for nft-level=18", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 18))).to.eq(100_000);
    });
    it("should return 0.100000[%] for nft-level=21", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 21))).to.eq(100_000);
    });
    it("should return 0.100000[%] for nft-level=24", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 24))).to.eq(100_000);
    });
  });
  describe("apr-bonus-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by one year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.120000[%] for nft-level=00", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 0))).to.eq(120_000);
    });
    it("should return 0.120000[%] for nft-level=03", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 3))).to.eq(120_000);
    });
    it("should return 0.120000[%] for nft-level=06", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 6))).to.eq(120_000);
    });
    it("should return 0.120000[%] for nft-level=09", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 9))).to.eq(120_000);
    });
    it("should return 0.120000[%] for nft-level=12", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 12))).to.eq(120_000);
    });
    it("should return 0.120000[%] for nft-level=15", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 15))).to.eq(120_000);
    });
    it("should return 0.120000[%] for nft-level=18", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 18))).to.eq(120_000);
    });
    it("should return 0.120000[%] for nft-level=21", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 21))).to.eq(120_000);
    });
    it("should return 0.120000[%] for nft-level=24", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 24))).to.eq(120_000);
    });
  });
  describe("apr-bonus-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 997 years`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 997]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 20.060000[%] for nft-level=00", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 0))).to.eq(20_060_000);
    });
    it("should return 20.060000[%] for nft-level=03", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 3))).to.eq(20_060_000);
    });
    it("should return 20.060000[%] for nft-level=06", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 6))).to.eq(20_060_000);
    });
    it("should return 20.060000[%] for nft-level=09", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 9))).to.eq(20_060_000);
    });
    it("should return 20.060000[%] for nft-level=12", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 12))).to.eq(20_060_000);
    });
    it("should return 20.060000[%] for nft-level=15", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 15))).to.eq(20_060_000);
    });
    it("should return 20.060000[%] for nft-level=18", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 18))).to.eq(20_060_000);
    });
    it("should return 20.060000[%] for nft-level=21", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 21))).to.eq(20_060_000);
    });
    it("should return 20.060000[%] for nft-level=24", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 24))).to.eq(20_060_000);
    });
  });
  describe("bonuses-length", async function () {
    it("should return a list of length=1", async function () {
      expect(await mty.bonusesLength(202103)).to.eq(1);
      expect(await mty.bonusesLength(202106)).to.eq(1);
      expect(await mty.bonusesLength(202109)).to.eq(1);
    });
  });
});
