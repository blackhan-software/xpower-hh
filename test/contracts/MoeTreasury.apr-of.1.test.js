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
    it("should return 0.000000[%] for nft-level=00", async function () {
      Expect(await mt.aprOf(1202100)).to.be.approximately(0x000_000, 1);
    });
    it("should return 1.000000[%] for nft-level=03", async function () {
      Expect(await mt.aprOf(1202103)).to.be.approximately(1_000_000, 1);
    });
    it("should return 2.000000[%] for nft-level=06", async function () {
      Expect(await mt.aprOf(1202106)).to.be.approximately(2_000_000, 1);
    });
    it("should return 3.000000[%] for nft-level=09", async function () {
      Expect(await mt.aprOf(1202109)).to.be.approximately(3_000_000, 1);
    });
    it("should return 4.000000[%] for nft-level=12", async function () {
      Expect(await mt.aprOf(1202112)).to.be.approximately(4_000_000, 1);
    });
    it("should return 5.000000[%] for nft-level=15", async function () {
      Expect(await mt.aprOf(1202115)).to.be.approximately(5_000_000, 1);
    });
    it("should return 6.000000[%] for nft-level=18", async function () {
      Expect(await mt.aprOf(1202118)).to.be.approximately(6_000_000, 1);
    });
    it("should return 7.000000[%] for nft-level=21", async function () {
      Expect(await mt.aprOf(1202121)).to.be.approximately(7_000_000, 1);
    });
    it("should return 8.000000[%] for nft-level=24", async function () {
      Expect(await mt.aprOf(1202124)).to.be.approximately(8_000_000, 1);
    });
  });
  describe("set-apr: **init** at 1[%]", async function () {
    it("should reparameterize", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(await mt.setAPR(1202103, [0, 3, 1000000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202106, [0, 3, 1000000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202109, [0, 3, 1000000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202112, [0, 3, 1000000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202115, [0, 3, 1000000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202118, [0, 3, 1000000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202121, [0, 3, 1000000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202124, [0, 3, 1000000])).to.not.eq(undefined);
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
        await moe_treasury.setAPR(1202103, [0, 3, 2000001]).catch((ex) => {
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
          .setAPR(1202103, [1000001, 3, 1000000])
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
        await moe_treasury.setAPR(1202103, [0, 3, 499999]).catch((ex) => {
          const m = ex.message.match(/invalid change: too small/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should reparameterize APR at 2.000000[%]", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(await mt.setAPR(1202103, [0, 3, 2000000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202106, [0, 3, 2000000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202109, [0, 3, 2000000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202112, [0, 3, 2000000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202115, [0, 3, 2000000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202118, [0, 3, 2000000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202121, [0, 3, 2000000])).to.not.eq(undefined);
      expect(await mt.setAPR(1202124, [0, 3, 2000000])).to.not.eq(undefined);
    });
    it("should *not* reparameterize (too frequent)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR(1202103, [0, 3, 1000000]).catch((ex) => {
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
      Expect(await mt.aprOf(1202100)).to.be.approximately(0x000_000, 1);
    });
    it("should return 1.200000[%] for nft-level=03", async function () {
      Expect(await mt.aprOf(1202103)).to.be.approximately(1_200_000, 1);
    });
    it("should return 2.400000[%] for nft-level=06", async function () {
      Expect(await mt.aprOf(1202106)).to.be.approximately(2_400_000, 1);
    });
    it("should return 3.600000[%] for nft-level=09", async function () {
      Expect(await mt.aprOf(1202109)).to.be.approximately(3_600_000, 1);
    });
    it("should return 4.800000[%] for nft-level=12", async function () {
      Expect(await mt.aprOf(1202112)).to.be.approximately(4_800_000, 1);
    });
    it("should return 6.000000[%] for nft-level=15", async function () {
      Expect(await mt.aprOf(1202115)).to.be.approximately(6_000_000, 1);
    });
    it("should return 7.200000[%] for nft-level=18", async function () {
      Expect(await mt.aprOf(1202118)).to.be.approximately(7_200_000, 1);
    });
    it("should return 8.399999[%] for nft-level=21", async function () {
      Expect(await mt.aprOf(1202121)).to.be.approximately(8_399_999, 1);
    });
    it("should return 9.599999[%] for nft-level=24", async function () {
      Expect(await mt.aprOf(1202124)).to.be.approximately(9_599_999, 1);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 0.25 year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      Expect(await mt.aprOf(1202100)).to.be.approximately(0x000_000, 1);
    });
    it("should return 1.333333[%] for nft-level=03", async function () {
      Expect(await mt.aprOf(1202103)).to.be.approximately(1_333_333, 1);
    });
    it("should return 2.666666[%] for nft-level=06", async function () {
      Expect(await mt.aprOf(1202106)).to.be.approximately(2_666_666, 1);
    });
    it("should return 3.999999[%] for nft-level=09", async function () {
      Expect(await mt.aprOf(1202109)).to.be.approximately(3_999_999, 1);
    });
    it("should return 5_333333[%] for nft-level=12", async function () {
      Expect(await mt.aprOf(1202112)).to.be.approximately(5_333_333, 1);
    });
    it("should return 6.666666[%] for nft-level=15", async function () {
      Expect(await mt.aprOf(1202115)).to.be.approximately(6_666_666, 1);
    });
    it("should return 7.999999[%] for nft-level=18", async function () {
      Expect(await mt.aprOf(1202118)).to.be.approximately(7_999_999, 1);
    });
    it("should return 9.333332[%] for nft-level=21", async function () {
      Expect(await mt.aprOf(1202121)).to.be.approximately(9_333_332, 1);
    });
    it("should return 10.666666[%] for nft-level=24", async function () {
      Expect(await mt.aprOf(1202124)).to.be.approximately(10_666_666, 1);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 0.25 year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      Expect(await mt.aprOf(1202100)).to.be.approximately(0x000_000, 1);
    });
    it("should return 1.428571[%] for nft-level=03", async function () {
      Expect(await mt.aprOf(1202103)).to.be.approximately(1_428_571, 1);
    });
    it("should return 2.857142[%] for nft-level=06", async function () {
      Expect(await mt.aprOf(1202106)).to.be.approximately(2_857_142, 1);
    });
    it("should return 4.285714[%] for nft-level=09", async function () {
      Expect(await mt.aprOf(1202109)).to.be.approximately(4_285_714, 1);
    });
    it("should return 5.714285[%] for nft-level=12", async function () {
      Expect(await mt.aprOf(1202112)).to.be.approximately(5_714_285, 1);
    });
    it("should return 7.142856[%] for nft-level=15", async function () {
      Expect(await mt.aprOf(1202115)).to.be.approximately(7_142_856, 1);
    });
    it("should return 8_571428[%] for nft-level=18", async function () {
      Expect(await mt.aprOf(1202118)).to.be.approximately(8_571_428, 1);
    });
    it("should return 9.999999[%] for nft-level=21", async function () {
      Expect(await mt.aprOf(1202121)).to.be.approximately(9_999_999, 1);
    });
    it("should return 11.428570[%] for nft-level=24", async function () {
      Expect(await mt.aprOf(1202124)).to.be.approximately(11_428_570, 1);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 0.25 years`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      Expect(await mt.aprOf(1202100)).to.be.approximately(0x000_000, 1);
    });
    it("should return 1.499999[%] for nft-level=03", async function () {
      Expect(await mt.aprOf(1202103)).to.be.approximately(1_499_999, 1);
    });
    it("should return 2.999999[%] for nft-level=06", async function () {
      Expect(await mt.aprOf(1202106)).to.be.approximately(2_999_999, 1);
    });
    it("should return 4.499999[%] for nft-level=09", async function () {
      Expect(await mt.aprOf(1202109)).to.be.approximately(4_499_999, 1);
    });
    it("should return 5.999999[%] for nft-level=12", async function () {
      Expect(await mt.aprOf(1202112)).to.be.approximately(5_999_999, 1);
    });
    it("should return 7.499999[%] for nft-level=15", async function () {
      Expect(await mt.aprOf(1202115)).to.be.approximately(7_499_999, 1);
    });
    it("should return 8.999999[%] for nft-level=18", async function () {
      Expect(await mt.aprOf(1202118)).to.be.approximately(8_999_999, 1);
    });
    it("should return 10.499999[%] for nft-level=21", async function () {
      Expect(await mt.aprOf(1202121)).to.be.approximately(10_499_999, 1);
    });
    it("should return 11.999999[%] for nft-level=24", async function () {
      Expect(await mt.aprOf(1202124)).to.be.approximately(11_999_999, 1);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 999 years`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 999]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      Expect(await mt.aprOf(1202100)).to.be.approximately(0x000_000, 1);
    });
    it("should return 1.999000[%] for nft-level=03", async function () {
      Expect(await mt.aprOf(1202103)).to.be.approximately(1_999_000, 1);
    });
    it("should return 3.998001[%] for nft-level=06", async function () {
      Expect(await mt.aprOf(1202106)).to.be.approximately(3_998_001, 1);
    });
    it("should return 5.997002[%] for nft-level=09", async function () {
      Expect(await mt.aprOf(1202109)).to.be.approximately(5_997_002, 1);
    });
    it("should return 7.996003[%] for nft-level=12", async function () {
      Expect(await mt.aprOf(1202112)).to.be.approximately(7_996_003, 1);
    });
    it("should return 9.995004[%] for nft-level=15", async function () {
      Expect(await mt.aprOf(1202115)).to.be.approximately(9_995_004, 1);
    });
    it("should return 11.994005[%] for nft-level=18", async function () {
      Expect(await mt.aprOf(1202118)).to.be.approximately(11_994_005, 1);
    });
    it("should return 13.993006[%] for nft-level=21", async function () {
      Expect(await mt.aprOf(1202121)).to.be.approximately(13_993_006, 1);
    });
    it("should return 15.992007[%] for nft-level=24", async function () {
      Expect(await mt.aprOf(1202124)).to.be.approximately(15_992_007, 1);
    });
  });
});
function Expect(big_number) {
  return expect(big_number.toNumber());
}
