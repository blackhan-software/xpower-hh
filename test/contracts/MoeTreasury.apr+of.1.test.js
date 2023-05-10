/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let APower, XPower, Nft, Ppt, NftTreasury, MoeTreasury; // contracts
let apower, xpower, nft, ppt, nft_treasury, moe_treasury, mt; // instances

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
    APower = await ethers.getContractFactory("APowerThor");
    expect(APower).to.exist;
    XPower = await ethers.getContractFactory("XPowerThorTest");
    expect(XPower).to.exist;
  });
  before(async function () {
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.exist;
    Ppt = await ethers.getContractFactory("XPowerPpt");
    expect(Ppt).to.exist;
    NftTreasury = await ethers.getContractFactory("NftTreasury");
    expect(NftTreasury).to.exist;
    MoeTreasury = await ethers.getContractFactory("MoeTreasury");
    expect(MoeTreasury).to.exist;
  });
  before(async function () {
    xpower = await XPower.deploy([], DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
    await xpower.init();
  });
  before(async function () {
    apower = await APower.deploy(xpower.address, [], DEADLINE);
    expect(apower).to.exist;
    await apower.deployed();
  });
  before(async function () {
    nft = await Nft.deploy(NFT_ODIN_URL, [xpower.address], [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
  });
  before(async function () {
    ppt = await Ppt.deploy(NFT_ODIN_URL, [], DEADLINE);
    expect(ppt).to.exist;
    await ppt.deployed();
  });
  before(async function () {
    nft_treasury = await NftTreasury.deploy(nft.address, ppt.address);
    expect(nft_treasury).to.exist;
    await nft_treasury.deployed();
  });
  before(async function () {
    mt = moe_treasury = await MoeTreasury.deploy(
      [xpower.address],
      [apower.address],
      ppt.address
    );
    expect(mt).to.exist;
    await mt.deployed();
  });
  before(async function () {
    await apower.transferOwnership(mt.address);
    expect(await apower.owner()).to.eq(mt.address);
  });
  describe("apr-bonus-of (i.e rewards ~ nft-level)", async function () {
    it("should return 0.020000[%] for nft-level=00", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 0, 1))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=03", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 3, 1))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=06", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 6, 1))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=09", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 9, 1))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=12", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 12, 1))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=15", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 15, 1))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=18", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 18, 1))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=21", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 21, 1))).to.eq(20_000);
    });
    it("should return 0.020000[%] for nft-level=24", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 24, 1))).to.eq(20_000);
    });
  });
  describe("set-apr: **init** at 0.010000[%]", async function () {
    it("should reparameterize", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_BONUS_ROLE(), addresses[0]);
      expect(await moe_treasury.setAPRBonus(1, [0, 0, 1, 10_000])).to.not.eq(
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
      await moe_treasury.grantRole(moe_treasury.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPRBonus(1, [0, 0, 1, 20_001]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too large)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await moe_treasury
          .setAPRBonus(1, [0, 30_001, 1, 10_000])
          .catch((ex) => {
            const m = ex.message.match(/invalid change: too large/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too small)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPRBonus(1, [0, 0, 1, 4_000]).catch((ex) => {
          const m = ex.message.match(/invalid change: too small/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too small)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await moe_treasury
          .setAPRBonus(1, [16_000, 0, 1, 10_000])
          .catch((ex) => {
            const m = ex.message.match(/invalid change: too small/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
    });
    it("should reparameterize", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_BONUS_ROLE(), addresses[0]);
      expect(await moe_treasury.setAPRBonus(1, [0, 0, 1, 20_000])).to.not.eq(
        undefined
      );
    });
    it("should *not* reparameterize (too frequent)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPRBonus(1, [0, 0, 1, 10_000]).catch((ex) => {
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
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 0, 1))).to.eq(54_999);
    });
    it("should return 0.054999[%] for nft-level=03", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 3, 1))).to.eq(54_999);
    });
    it("should return 0.054999[%] for nft-level=06", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 6, 1))).to.eq(54_999);
    });
    it("should return 0.054999[%] for nft-level=09", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 9, 1))).to.eq(54_999);
    });
    it("should return 0.054999[%] for nft-level=12", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 12, 1))).to.eq(54_999);
    });
    it("should return 0.054999[%] for nft-level=15", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 15, 1))).to.eq(54_999);
    });
    it("should return 0.054999[%] for nft-level=18", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 18, 1))).to.eq(54_999);
    });
    it("should return 0.054999[%] for nft-level=21", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 21, 1))).to.eq(54_999);
    });
    it("should return 0.054999[%] for nft-level=24", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 24, 1))).to.eq(54_999);
    });
  });
  describe("apr-bonus-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by one year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.076666[%] for nft-level=00", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 0, 1))).to.eq(76_666);
    });
    it("should return 0.076666[%] for nft-level=03", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 3, 1))).to.eq(76_666);
    });
    it("should return 0.076666[%] for nft-level=06", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 6, 1))).to.eq(76_666);
    });
    it("should return 0.076666[%] for nft-level=09", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 9, 1))).to.eq(76_666);
    });
    it("should return 0.076666[%] for nft-level=12", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 12, 1))).to.eq(76_666);
    });
    it("should return 0.076666[%] for nft-level=15", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 15, 1))).to.eq(76_666);
    });
    it("should return 0.076666[%] for nft-level=18", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 18, 1))).to.eq(76_666);
    });
    it("should return 0.076666[%] for nft-level=21", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 21, 1))).to.eq(76_666);
    });
    it("should return 0.076666[%] for nft-level=24", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 24, 1))).to.eq(76_666);
    });
  });
  describe("apr-bonus-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by one year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.097499[%] for nft-level=00", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 0, 1))).to.eq(97_499);
    });
    it("should return 0.097499[%] for nft-level=03", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 3, 1))).to.eq(97_499);
    });
    it("should return 0.097499[%] for nft-level=06", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 6, 1))).to.eq(97_499);
    });
    it("should return 0.097499[%] for nft-level=09", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 9, 1))).to.eq(97_499);
    });
    it("should return 0.097499[%] for nft-level=12", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 12, 1))).to.eq(97_499);
    });
    it("should return 0.097499[%] for nft-level=15", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 15, 1))).to.eq(97_499);
    });
    it("should return 0.097499[%] for nft-level=18", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 18, 1))).to.eq(97_499);
    });
    it("should return 0.097499[%] for nft-level=21", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 21, 1))).to.eq(97_499);
    });
    it("should return 0.097499[%] for nft-level=24", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 24, 1))).to.eq(97_499);
    });
  });
  describe("apr-bonus-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 997 years`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 999]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 20.079990[%] for nft-level=00", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 0, 1))).to.eq(20_079_990);
    });
    it("should return 20.079990[%] for nft-level=03", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 3, 1))).to.eq(20_079_990);
    });
    it("should return 20.079990[%] for nft-level=06", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 6, 1))).to.eq(20_079_990);
    });
    it("should return 20.079990[%] for nft-level=09", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 9, 1))).to.eq(20_079_990);
    });
    it("should return 20.079990[%] for nft-level=12", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 12, 1))).to.eq(20_079_990);
    });
    it("should return 20.079990[%] for nft-level=15", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 15, 1))).to.eq(20_079_990);
    });
    it("should return 20.079990[%] for nft-level=18", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 18, 1))).to.eq(20_079_990);
    });
    it("should return 20.079990[%] for nft-level=21", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 21, 1))).to.eq(20_079_990);
    });
    it("should return 20.079990[%] for nft-level=24", async function () {
      expect(await mt.aprBonusOf(ppt.idBy(YEAR, 24, 1))).to.eq(20_079_990);
    });
  });
});
