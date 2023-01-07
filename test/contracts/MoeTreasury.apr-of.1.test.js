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
  describe("apr-of (i.e rewards ~ nft-level)", async function () {
    it("should return 0.000[%] for nft-level=00", async function () {
      expect(await mt.aprOf(1202100)).to.eq(0x000);
    });
    it("should return 1.000[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(1_000);
    });
    it("should return 2.000[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(2_000);
    });
    it("should return 3.000[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(3_000);
    });
    it("should return 4.000[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(4_000);
    });
    it("should return 5.000[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(5_000);
    });
    it("should return 6.000[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(6_000);
    });
    it("should return 7.000[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(7_000);
    });
    it("should return 8.000[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(8_000);
    });
  });
  describe("set-apr (double from 1% to 2%)", async function () {
    it(`should forward time by 1.00 year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
      await network.provider.send("evm_mine", []);
    });
    it("should *not* reparameterize (invalid change: too large)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury
          .setAPR(1, 2021, [0, 0, 3, 2001, 0, 0])
          .catch((ex) => {
            const m = ex.message.match(/invalid change: too large/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (invalid change: too large)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury
          .setAPR(1, 2021, [0, 1001, 3, 1000, 0, 0])
          .catch((ex) => {
            const m = ex.message.match(/invalid change: too large/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (invalid change: too small)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR(1, 2021, [0, 0, 3, 499, 0, 0]).catch((ex) => {
          const m = ex.message.match(/invalid change: too small/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (invalid change: too small)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury
          .setAPR(1, 2021, [501, 0, 3, 1000, 0, 0])
          .catch((ex) => {
            const m = ex.message.match(/invalid change: too small/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
    });
    it("should reparameterize APR", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR(1, 2021, [0, 0, 3, 2000, 0, 0])
      ).to.not.eq(undefined);
    });
    it("should *not* reparameterize (invalid change: too frequent)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury
          .setAPR(1, 2021, [0, 0, 3, 1000, 0, 0])
          .catch((ex) => {
            const m = ex.message.match(/invalid change: too frequent/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 0.25 year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000[%] for nft-level=00", async function () {
      expect(await mt.aprOf(1202100)).to.eq(0x000);
    });
    it("should return 1.499[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(1_250);
    });
    it("should return 2.999[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(2_500);
    });
    it("should return 4.499[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(3_750);
    });
    it("should return 5.999[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(5_000);
    });
    it("should return 7.499[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(6_250);
    });
    it("should return 8.999[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(7_500);
    });
    it("should return 10.499[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(8_750);
    });
    it("should return 11.999[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(10_000);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 0.25 year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000[%] for nft-level=00", async function () {
      expect(await mt.aprOf(1202100)).to.eq(0x000);
    });
    it("should return 1.666[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(1_500);
    });
    it("should return 3.333[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(3_000);
    });
    it("should return 4.999[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(4_500);
    });
    it("should return 6.666[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(6_000);
    });
    it("should return 8.333[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(7_500);
    });
    it("should return 9.999[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(9_000);
    });
    it("should return 11.666[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(10_500);
    });
    it("should return 13.333[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(12_000);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 0.25 year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000[%] for nft-level=00", async function () {
      expect(await mt.aprOf(1202100)).to.eq(0x000);
    });
    it("should return 1.749[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(1_750);
    });
    it("should return 3.499[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(3_500);
    });
    it("should return 5.249[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(5_250);
    });
    it("should return 6.999[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(7_000);
    });
    it("should return 8.749[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(8_750);
    });
    it("should return 10.499[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(10_500);
    });
    it("should return 12.249[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(12_250);
    });
    it("should return 13.999[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(14_000);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 0.25 years`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000[%] for nft-level=00", async function () {
      expect(await mt.aprOf(1202100)).to.eq(0x000);
    });
    it("should return 1.999[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(2_000);
    });
    it("should return 3.998[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(4_000);
    });
    it("should return 5.997[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(6_000);
    });
    it("should return 7.996[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(8_000);
    });
    it("should return 9.995[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(10_000);
    });
    it("should return 11.994[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(12_000);
    });
    it("should return 13.993[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(14_000);
    });
    it("should return 15.992[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(16_000);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 999 years`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 999]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000[%] for nft-level=00", async function () {
      expect(await mt.aprOf(1202100)).to.eq(0x000);
    });
    it("should return 1.999[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(2_000);
    });
    it("should return 3.998[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(4_000);
    });
    it("should return 5.997[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(6_000);
    });
    it("should return 7.996[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(8_000);
    });
    it("should return 9.995[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(10_000);
    });
    it("should return 11.994[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(12_000);
    });
    it("should return 13.993[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(14_000);
    });
    it("should return 15.992[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(16_000);
    });
  });
});
