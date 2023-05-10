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
  describe("set-apr: **init** at 1[%]", async function () {
    it("should reparameterize", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(await moe_treasury.setAPR(1, [0, 0, 3, 1000000])).to.not.eq(
        undefined
      );
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
        await moe_treasury.setAPR(1, [0, 0, 3, 2000001]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too large)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR(1, [0, 1000001, 3, 1000000]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too small)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR(1, [0, 0, 3, 499999]).catch((ex) => {
          const m = ex.message.match(/invalid change: too small/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too small)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR(1, [500001, 0, 3, 1000000]).catch((ex) => {
          const m = ex.message.match(/invalid change: too small/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should reparameterize APR at 2.000000[%]", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(await moe_treasury.setAPR(1, [0, 0, 3, 2000000])).to.not.eq(
        undefined
      );
    });
    it("should *not* reparameterize (too frequent)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR(1, [0, 0, 3, 1000000]).catch((ex) => {
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
    it("should return 1.199999[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(1_199_999);
    });
    it("should return 2.399998[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(2_399_998);
    });
    it("should return 3.599997[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(3_599_997);
    });
    it("should return 4.799996[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(4_799_996);
    });
    it("should return 5.999995[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(5_999_995);
    });
    it("should return 7.199994[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(7_199_994);
    });
    it("should return 8.399993[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(8_399_993);
    });
    it("should return 9.599992[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(9_599_992);
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
    it("should return 1.333333[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(1_333_333);
    });
    it("should return 2.666666[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(2_666_666);
    });
    it("should return 3.999999[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(3_999_999);
    });
    it("should return 5_333332[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(5_333_332);
    });
    it("should return 6.666665[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(6_666_665);
    });
    it("should return 7.999998[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(7_999_998);
    });
    it("should return 9.333331[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(9_333_331);
    });
    it("should return 10.666664[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(10_666_664);
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
    it("should return 1.428571[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(1_428_571);
    });
    it("should return 2.857142[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(2_857_142);
    });
    it("should return 4.285713[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(4_285_713);
    });
    it("should return 5.714284[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(5_714_284);
    });
    it("should return 7.142855[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(7_142_855);
    });
    it("should return 8_571426[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(8_571_426);
    });
    it("should return 9.999996[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(9_999_997);
    });
    it("should return 11.428568[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(11_428_568);
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
    it("should return 1.499999[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(1_499_999);
    });
    it("should return 2.999998[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(2_999_998);
    });
    it("should return 4.499997[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(4_499_997);
    });
    it("should return 5.999996[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(5_999_996);
    });
    it("should return 7.499995[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(7_499_995);
    });
    it("should return 8.999994[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(8_999_994);
    });
    it("should return 10.499993[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(10_499_993);
    });
    it("should return 11.999992[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(11_999_992);
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
    it("should return 1.999000[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(1_999_000);
    });
    it("should return 3.998000[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(3_998_000);
    });
    it("should return 5.997000[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(5_997_000);
    });
    it("should return 7.996000[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(7_996_000);
    });
    it("should return 9.995000[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(9_995_000);
    });
    it("should return 11.994000[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(11_994_000);
    });
    it("should return 13.993000[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(13_993_000);
    });
    it("should return 15.992000[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(15_992_000);
    });
  });
});
