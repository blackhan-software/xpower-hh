/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Sov, Nft, Ppt, Mty, Nty; // contracts
let moe, sov, nft, ppt, mty, nty; // instances

const NFT_ODIN_URL = "https://xpowermine.com/nfts/thor/{id}.json";
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
    Moe = await ethers.getContractFactory("XPowerThorTest");
    expect(Moe).to.exist;
    Sov = await ethers.getContractFactory("APowerThor");
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
    nft = await Nft.deploy(NFT_ODIN_URL, [moe.address], [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
    ppt = await Ppt.deploy(NFT_ODIN_URL, [], DEADLINE);
    expect(ppt).to.exist;
    await ppt.deployed();
  });
  before(async function () {
    mty = await Mty.deploy([moe.address], [sov.address], ppt.address);
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
  describe("apr-bonus-of (i.e rewards ~ nft-level)", async function () {
    it("should return 0.020000[%] for nft-level=00", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 0, 1))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=03", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 3, 1))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=06", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 6, 1))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=09", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 9, 1))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=12", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 12, 1))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=15", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 15, 1))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=18", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 18, 1))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=21", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 21, 1))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=24", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 24, 1))).to.eq(20_000);
    });
  });
  describe("set-apr: **init** at 0.010000[%]", async function () {
    it("should reparameterize", async function () {
      await mty.grantRole(mty.APR_BONUS_ROLE(), addresses[0]);
      expect(await mty.setAPRBonus(1202103, [0, 1, 10_000])).to.not.eq(
        undefined
      );
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
        await mty.setAPRBonus(1202103, [0, 1, 20_001]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too large)", async function () {
      await mty.grantRole(mty.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await mty.setAPRBonus(1202103, [30_001, 1, 10_000]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too small)", async function () {
      await mty.grantRole(mty.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await mty.setAPRBonus(1202103, [0, 1, 4_000]).catch((ex) => {
          const m = ex.message.match(/invalid change: too small/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should reparameterize", async function () {
      await mty.grantRole(mty.APR_BONUS_ROLE(), addresses[0]);
      expect(await mty.setAPRBonus(1202103, [0, 1, 20_000])).to.not.eq(
        undefined
      );
    });
    it("should *not* reparameterize (too frequent)", async function () {
      await mty.grantRole(mty.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await mty.setAPRBonus(1202103, [0, 1, 10_000]).catch((ex) => {
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
    it("should return 0.054999[%] for nft-level=00", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 0, 1))).to.eq(54_999);
    });
    it("should return 0.054999[%] for nft-level=03", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 3, 1))).to.eq(54_999);
    });
    it("should return 0.054999[%] for nft-level=06", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 6, 1))).to.eq(54_999);
    });
    it("should return 0.054999[%] for nft-level=09", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 9, 1))).to.eq(54_999);
    });
    it("should return 0.054999[%] for nft-level=12", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 12, 1))).to.eq(54_999);
    });
    it("should return 0.054999[%] for nft-level=15", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 15, 1))).to.eq(54_999);
    });
    it("should return 0.054999[%] for nft-level=18", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 18, 1))).to.eq(54_999);
    });
    it("should return 0.054999[%] for nft-level=21", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 21, 1))).to.eq(54_999);
    });
    it("should return 0.054999[%] for nft-level=24", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 24, 1))).to.eq(54_999);
    });
  });
  describe("apr-bonus-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by one year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.076666[%] for nft-level=00", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 0, 1))).to.eq(76_666);
    });
    it("should return 0.076666[%] for nft-level=03", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 3, 1))).to.eq(76_666);
    });
    it("should return 0.076666[%] for nft-level=06", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 6, 1))).to.eq(76_666);
    });
    it("should return 0.076666[%] for nft-level=09", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 9, 1))).to.eq(76_666);
    });
    it("should return 0.076666[%] for nft-level=12", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 12, 1))).to.eq(76_666);
    });
    it("should return 0.076666[%] for nft-level=15", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 15, 1))).to.eq(76_666);
    });
    it("should return 0.076666[%] for nft-level=18", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 18, 1))).to.eq(76_666);
    });
    it("should return 0.076666[%] for nft-level=21", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 21, 1))).to.eq(76_666);
    });
    it("should return 0.076666[%] for nft-level=24", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 24, 1))).to.eq(76_666);
    });
  });
  describe("apr-bonus-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by one year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.097499[%] for nft-level=00", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 0, 1))).to.eq(97_499);
    });
    it("should return 0.097499[%] for nft-level=03", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 3, 1))).to.eq(97_499);
    });
    it("should return 0.097499[%] for nft-level=06", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 6, 1))).to.eq(97_499);
    });
    it("should return 0.097499[%] for nft-level=09", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 9, 1))).to.eq(97_499);
    });
    it("should return 0.097499[%] for nft-level=12", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 12, 1))).to.eq(97_499);
    });
    it("should return 0.097499[%] for nft-level=15", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 15, 1))).to.eq(97_499);
    });
    it("should return 0.097499[%] for nft-level=18", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 18, 1))).to.eq(97_499);
    });
    it("should return 0.097499[%] for nft-level=21", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 21, 1))).to.eq(97_499);
    });
    it("should return 0.097499[%] for nft-level=24", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 24, 1))).to.eq(97_499);
    });
  });
  describe("apr-bonus-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 997 years`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 999]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 20.079990[%] for nft-level=00", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 0, 1))).to.eq(20_079_990);
    });
    it("should return 20.079990[%] for nft-level=03", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 3, 1))).to.eq(20_079_990);
    });
    it("should return 20.079990[%] for nft-level=06", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 6, 1))).to.eq(20_079_990);
    });
    it("should return 20.079990[%] for nft-level=09", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 9, 1))).to.eq(20_079_990);
    });
    it("should return 20.079990[%] for nft-level=12", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 12, 1))).to.eq(20_079_990);
    });
    it("should return 20.079990[%] for nft-level=15", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 15, 1))).to.eq(20_079_990);
    });
    it("should return 20.079990[%] for nft-level=18", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 18, 1))).to.eq(20_079_990);
    });
    it("should return 20.079990[%] for nft-level=21", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 21, 1))).to.eq(20_079_990);
    });
    it("should return 20.079990[%] for nft-level=24", async function () {
      expect(await mty.aprBonusOf(ppt.idBy(YEAR, 24, 1))).to.eq(20_079_990);
    });
  });
});
