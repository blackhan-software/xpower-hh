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
  describe("aprs-length", async function () {
    it("should return a list of length=0", async function () {
      expect(await mt.aprsLength(1202103)).to.eq(0);
      expect(await mt.aprsLength(2202103)).to.eq(0);
      expect(await mt.aprsLength(3202103)).to.eq(0);
      expect(await mt.aprsLength(4202103)).to.eq(0);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level)", async function () {
    it("should return 0.000000[%] for nft-level=00", async function () {
      expect(await mt.aprOf(1202100)).to.eq(0x000_000);
    });
    it("should return 1.000000[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(1_000_000);
    });
    it("should return 2.000000[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(2_000_000);
    });
    it("should return 3.000000[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(3_000_000);
    });
    it("should return 4.000000[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(4_000_000);
    });
    it("should return 5.000000[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(5_000_000);
    });
    it("should return 6.000000[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(6_000_000);
    });
    it("should return 7.000000[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(7_000_000);
    });
    it("should return 8.000000[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(8_000_000);
    });
  });
  describe("set-apr (double from 1[%] to 2[%])", async function () {
    it(`should forward time by one year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
      await network.provider.send("evm_mine", []);
    });
    it("should *not* reparameterize (too large)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR(1202103, [0, 3, 2_000_001]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too large)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury
          .setAPR(1202103, [1_000_001, 3, 1_000_000])
          .catch((ex) => {
            const m = ex.message.match(/invalid change: too large/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too small)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR(1202103, [0, 3, 499_999]).catch((ex) => {
          const m = ex.message.match(/invalid change: too small/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should reparameterize APR at 2.000000[%]", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(await mt.setAPR(1202103, [0, 3, 2_000_000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202106, [0, 3, 2_000_000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202109, [0, 3, 2_000_000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202112, [0, 3, 2_000_000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202115, [0, 3, 2_000_000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202118, [0, 3, 2_000_000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202121, [0, 3, 2_000_000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202124, [0, 3, 2_000_000])).to.not.eq(undefined);
    });
    it("should *not* reparameterize (too frequent)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR(1202103, [0, 3, 1_000_000]).catch((ex) => {
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
    it("should return 0.000000[%] for nft-level=00", async function () {
      expect(await mt.aprOf(1202100)).to.eq(0x000_000);
    });
    it("should return 2.000000[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(2_000_000);
    });
    it("should return 4.000000[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(4_000_000);
    });
    it("should return 6.000000[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(6_000_000);
    });
    it("should return 8.000000[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(8_000_000);
    });
    it("should return 10.000000[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(10_000_000);
    });
    it("should return 12.000000[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(12_000_000);
    });
    it("should return 14.000000[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(14_000_000);
    });
    it("should return 16.000000[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(16_000_000);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 0.25 year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      expect(await mt.aprOf(1202100)).to.eq(0x000_000);
    });
    it("should return 2.000000[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(2_000_000);
    });
    it("should return 4.000000[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(4_000_000);
    });
    it("should return 6.000000[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(6_000_000);
    });
    it("should return 8.000000[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(8_000_000);
    });
    it("should return 10.000000[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(10_000_000);
    });
    it("should return 12.000000[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(12_000_000);
    });
    it("should return 14.000000[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(14_000_000);
    });
    it("should return 16.000000[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(16_000_000);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 0.25 year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      expect(await mt.aprOf(1202100)).to.eq(0x000_000);
    });
    it("should return 2.000000[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(2_000_000);
    });
    it("should return 4.000000[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(4_000_000);
    });
    it("should return 6.000000[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(6_000_000);
    });
    it("should return 8.000000[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(8_000_000);
    });
    it("should return 10.000000[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(10_000_000);
    });
    it("should return 12.000000[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(12_000_000);
    });
    it("should return 14.000000[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(14_000_000);
    });
    it("should return 16.000000[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(16_000_000);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 0.25 years`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      expect(await mt.aprOf(1202100)).to.eq(0x000_000);
    });
    it("should return 2.000000[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(2_000_000);
    });
    it("should return 4.000000[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(4_000_000);
    });
    it("should return 6.000000[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(6_000_000);
    });
    it("should return 8.000000[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(8_000_000);
    });
    it("should return 10.000000[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(10_000_000);
    });
    it("should return 12.000000[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(12_000_000);
    });
    it("should return 14.000000[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(14_000_000);
    });
    it("should return 16.000000[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(16_000_000);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 999 years`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 999]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      expect(await mt.aprOf(1202100)).to.eq(0x000_000);
    });
    it("should return 2.000000[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(2_000_000);
    });
    it("should return 4.000000[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(4_000_000);
    });
    it("should return 6.000000[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(6_000_000);
    });
    it("should return 8.000000[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(8_000_000);
    });
    it("should return 10.000000[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(10_000_000);
    });
    it("should return 12.000000[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(12_000_000);
    });
    it("should return 14.000000[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(14_000_000);
    });
    it("should return 16.000000[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(16_000_000);
    });
  });
  describe("aprs-length", async function () {
    it("should return a list of length=1", async function () {
      expect(await mt.aprsLength(1202103)).to.eq(1);
    });
    it("should return a list of length=0", async function () {
      expect(await mt.aprsLength(2202103)).to.eq(0);
      expect(await mt.aprsLength(3202103)).to.eq(0);
      expect(await mt.aprsLength(4202103)).to.eq(0);
    });
  });
});
