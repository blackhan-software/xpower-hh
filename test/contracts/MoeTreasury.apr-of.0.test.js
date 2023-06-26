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
  describe("aprs-length", async function () {
    it("should return a list of length=0", async function () {
      expect(await mty.aprsLength(1202103)).to.eq(0);
      expect(await mty.aprsLength(2202103)).to.eq(0);
      expect(await mty.aprsLength(3202103)).to.eq(0);
      expect(await mty.aprsLength(4202103)).to.eq(0);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level)", async function () {
    it("should return 0.000000[%] for nft-level=00", async function () {
      expect(await mty.aprOf(1202100)).to.eq(0x000_000);
    });
    it("should return 1.000000[%] for nft-level=03", async function () {
      expect(await mty.aprOf(1202103)).to.eq(1_000_000);
    });
    it("should return 2.000000[%] for nft-level=06", async function () {
      expect(await mty.aprOf(1202106)).to.eq(2_000_000);
    });
    it("should return 3.000000[%] for nft-level=09", async function () {
      expect(await mty.aprOf(1202109)).to.eq(3_000_000);
    });
    it("should return 4.000000[%] for nft-level=12", async function () {
      expect(await mty.aprOf(1202112)).to.eq(4_000_000);
    });
    it("should return 5.000000[%] for nft-level=15", async function () {
      expect(await mty.aprOf(1202115)).to.eq(5_000_000);
    });
    it("should return 6.000000[%] for nft-level=18", async function () {
      expect(await mty.aprOf(1202118)).to.eq(6_000_000);
    });
    it("should return 7.000000[%] for nft-level=21", async function () {
      expect(await mty.aprOf(1202121)).to.eq(7_000_000);
    });
    it("should return 8.000000[%] for nft-level=24", async function () {
      expect(await mty.aprOf(1202124)).to.eq(8_000_000);
    });
  });
  describe("set-apr (double from 1[%] to 2[%])", async function () {
    it(`should forward time by one year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
      await network.provider.send("evm_mine", []);
    });
    it("should *not* reparameterize (too large)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(1202103, [0, 3, 2_000_001]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too large)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(1202103, [1_000_001, 3, 1_000_000]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too small)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(1202103, [0, 3, 499_999]).catch((ex) => {
          const m = ex.message.match(/invalid change: too small/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should reparameterize APR at 2.000000[%]", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(await mty.setAPR(1202103, [0, 3, 2_000_000])).to.not.eq(undefined);
      expect(await mty.setAPR(1202106, [0, 3, 2_000_000])).to.not.eq(undefined);
      expect(await mty.setAPR(1202109, [0, 3, 2_000_000])).to.not.eq(undefined);
      expect(await mty.setAPR(1202112, [0, 3, 2_000_000])).to.not.eq(undefined);
      expect(await mty.setAPR(1202115, [0, 3, 2_000_000])).to.not.eq(undefined);
      expect(await mty.setAPR(1202118, [0, 3, 2_000_000])).to.not.eq(undefined);
      expect(await mty.setAPR(1202121, [0, 3, 2_000_000])).to.not.eq(undefined);
      expect(await mty.setAPR(1202124, [0, 3, 2_000_000])).to.not.eq(undefined);
    });
    it("should *not* reparameterize (too frequent)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(1202103, [0, 3, 1_000_000]).catch((ex) => {
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
      expect(await mty.aprOf(1202100)).to.eq(0x000_000);
    });
    it("should return 2.000000[%] for nft-level=03", async function () {
      expect(await mty.aprOf(1202103)).to.eq(2_000_000);
    });
    it("should return 4.000000[%] for nft-level=06", async function () {
      expect(await mty.aprOf(1202106)).to.eq(4_000_000);
    });
    it("should return 6.000000[%] for nft-level=09", async function () {
      expect(await mty.aprOf(1202109)).to.eq(6_000_000);
    });
    it("should return 8.000000[%] for nft-level=12", async function () {
      expect(await mty.aprOf(1202112)).to.eq(8_000_000);
    });
    it("should return 10.000000[%] for nft-level=15", async function () {
      expect(await mty.aprOf(1202115)).to.eq(10_000_000);
    });
    it("should return 12.000000[%] for nft-level=18", async function () {
      expect(await mty.aprOf(1202118)).to.eq(12_000_000);
    });
    it("should return 14.000000[%] for nft-level=21", async function () {
      expect(await mty.aprOf(1202121)).to.eq(14_000_000);
    });
    it("should return 16.000000[%] for nft-level=24", async function () {
      expect(await mty.aprOf(1202124)).to.eq(16_000_000);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 0.25 year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      expect(await mty.aprOf(1202100)).to.eq(0x000_000);
    });
    it("should return 2.000000[%] for nft-level=03", async function () {
      expect(await mty.aprOf(1202103)).to.eq(2_000_000);
    });
    it("should return 4.000000[%] for nft-level=06", async function () {
      expect(await mty.aprOf(1202106)).to.eq(4_000_000);
    });
    it("should return 6.000000[%] for nft-level=09", async function () {
      expect(await mty.aprOf(1202109)).to.eq(6_000_000);
    });
    it("should return 8.000000[%] for nft-level=12", async function () {
      expect(await mty.aprOf(1202112)).to.eq(8_000_000);
    });
    it("should return 10.000000[%] for nft-level=15", async function () {
      expect(await mty.aprOf(1202115)).to.eq(10_000_000);
    });
    it("should return 12.000000[%] for nft-level=18", async function () {
      expect(await mty.aprOf(1202118)).to.eq(12_000_000);
    });
    it("should return 14.000000[%] for nft-level=21", async function () {
      expect(await mty.aprOf(1202121)).to.eq(14_000_000);
    });
    it("should return 16.000000[%] for nft-level=24", async function () {
      expect(await mty.aprOf(1202124)).to.eq(16_000_000);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 0.25 year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      expect(await mty.aprOf(1202100)).to.eq(0x000_000);
    });
    it("should return 2.000000[%] for nft-level=03", async function () {
      expect(await mty.aprOf(1202103)).to.eq(2_000_000);
    });
    it("should return 4.000000[%] for nft-level=06", async function () {
      expect(await mty.aprOf(1202106)).to.eq(4_000_000);
    });
    it("should return 6.000000[%] for nft-level=09", async function () {
      expect(await mty.aprOf(1202109)).to.eq(6_000_000);
    });
    it("should return 8.000000[%] for nft-level=12", async function () {
      expect(await mty.aprOf(1202112)).to.eq(8_000_000);
    });
    it("should return 10.000000[%] for nft-level=15", async function () {
      expect(await mty.aprOf(1202115)).to.eq(10_000_000);
    });
    it("should return 12.000000[%] for nft-level=18", async function () {
      expect(await mty.aprOf(1202118)).to.eq(12_000_000);
    });
    it("should return 14.000000[%] for nft-level=21", async function () {
      expect(await mty.aprOf(1202121)).to.eq(14_000_000);
    });
    it("should return 16.000000[%] for nft-level=24", async function () {
      expect(await mty.aprOf(1202124)).to.eq(16_000_000);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 0.25 years`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      expect(await mty.aprOf(1202100)).to.eq(0x000_000);
    });
    it("should return 2.000000[%] for nft-level=03", async function () {
      expect(await mty.aprOf(1202103)).to.eq(2_000_000);
    });
    it("should return 4.000000[%] for nft-level=06", async function () {
      expect(await mty.aprOf(1202106)).to.eq(4_000_000);
    });
    it("should return 6.000000[%] for nft-level=09", async function () {
      expect(await mty.aprOf(1202109)).to.eq(6_000_000);
    });
    it("should return 8.000000[%] for nft-level=12", async function () {
      expect(await mty.aprOf(1202112)).to.eq(8_000_000);
    });
    it("should return 10.000000[%] for nft-level=15", async function () {
      expect(await mty.aprOf(1202115)).to.eq(10_000_000);
    });
    it("should return 12.000000[%] for nft-level=18", async function () {
      expect(await mty.aprOf(1202118)).to.eq(12_000_000);
    });
    it("should return 14.000000[%] for nft-level=21", async function () {
      expect(await mty.aprOf(1202121)).to.eq(14_000_000);
    });
    it("should return 16.000000[%] for nft-level=24", async function () {
      expect(await mty.aprOf(1202124)).to.eq(16_000_000);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 999 years`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 999]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      expect(await mty.aprOf(1202100)).to.eq(0x000_000);
    });
    it("should return 2.000000[%] for nft-level=03", async function () {
      expect(await mty.aprOf(1202103)).to.eq(2_000_000);
    });
    it("should return 4.000000[%] for nft-level=06", async function () {
      expect(await mty.aprOf(1202106)).to.eq(4_000_000);
    });
    it("should return 6.000000[%] for nft-level=09", async function () {
      expect(await mty.aprOf(1202109)).to.eq(6_000_000);
    });
    it("should return 8.000000[%] for nft-level=12", async function () {
      expect(await mty.aprOf(1202112)).to.eq(8_000_000);
    });
    it("should return 10.000000[%] for nft-level=15", async function () {
      expect(await mty.aprOf(1202115)).to.eq(10_000_000);
    });
    it("should return 12.000000[%] for nft-level=18", async function () {
      expect(await mty.aprOf(1202118)).to.eq(12_000_000);
    });
    it("should return 14.000000[%] for nft-level=21", async function () {
      expect(await mty.aprOf(1202121)).to.eq(14_000_000);
    });
    it("should return 16.000000[%] for nft-level=24", async function () {
      expect(await mty.aprOf(1202124)).to.eq(16_000_000);
    });
  });
  describe("aprs-length", async function () {
    it("should return a list of length=1", async function () {
      expect(await mty.aprsLength(1202103)).to.eq(1);
    });
    it("should return a list of length=0", async function () {
      expect(await mty.aprsLength(2202103)).to.eq(0);
      expect(await mty.aprsLength(3202103)).to.eq(0);
      expect(await mty.aprsLength(4202103)).to.eq(0);
    });
  });
});
