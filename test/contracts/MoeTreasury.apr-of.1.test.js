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
  describe("set-apr: **init** at 1[%]", async function () {
    it("should reparameterize", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(await moe_treasury.setAPR(1, [0, 0, 3, 1000])).to.not.eq(
        undefined
      );
    });
  });
  describe("set-apr (double from 1[%] to 2[%])", async function () {
    it(`should forward time by one year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
      await network.provider.send("evm_mine", []);
    });
    it("should *not* reparameterize (invalid change: too large)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR(1, [0, 0, 3, 2001]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (invalid change: too large)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR(1, [0, 1001, 3, 1000]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (invalid change: too small)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR(1, [0, 0, 3, 499]).catch((ex) => {
          const m = ex.message.match(/invalid change: too small/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (invalid change: too small)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR(1, [501, 0, 3, 1000]).catch((ex) => {
          const m = ex.message.match(/invalid change: too small/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should reparameterize APR at 2.000[%]", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(await moe_treasury.setAPR(1, [0, 0, 3, 2000])).to.not.eq(
        undefined
      );
    });
    it("should *not* reparameterize (invalid change: too frequent)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR(1, [0, 0, 3, 1000]).catch((ex) => {
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
    it("should return 1.199[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(1_199);
    });
    it("should return 2.398[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(2_398);
    });
    it("should return 3.597[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(3_597);
    });
    it("should return 4.796[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(4_796);
    });
    it("should return 5.995[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(5_995);
    });
    it("should return 7.194[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(7_194);
    });
    it("should return 8.393[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(8_393);
    });
    it("should return 9.592[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(9_592);
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
    it("should return 1.333[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(1_333);
    });
    it("should return 2.666[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(2_666);
    });
    it("should return 3.999[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(3_999);
    });
    it("should return 5_332[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(5_332);
    });
    it("should return 6.665[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(6_665);
    });
    it("should return 7.998[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(7_998);
    });
    it("should return 9.331[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(9_331);
    });
    it("should return 10.664[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(10_664);
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
    it("should return 1.428[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(1_428);
    });
    it("should return 2.856[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(2_856);
    });
    it("should return 4.284[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(4_284);
    });
    it("should return 5.712[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(5_712);
    });
    it("should return 7.140[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(7_140);
    });
    it("should return 8_568[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(8_568);
    });
    it("should return 9.996[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(9_996);
    });
    it("should return 11.424[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(11_424);
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
    it("should return 1.499[%] for nft-level=03", async function () {
      expect(await mt.aprOf(1202103)).to.eq(1_499);
    });
    it("should return 2.998[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(2_998);
    });
    it("should return 4.497[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(4_497);
    });
    it("should return 5.996[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(5_996);
    });
    it("should return 7.495[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(7_495);
    });
    it("should return 8.994[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(8_994);
    });
    it("should return 10.493[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(10_493);
    });
    it("should return 11.992[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(11_992);
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
      expect(await mt.aprOf(1202103)).to.eq(1_999);
    });
    it("should return 3.998[%] for nft-level=06", async function () {
      expect(await mt.aprOf(1202106)).to.eq(3_998);
    });
    it("should return 5.997[%] for nft-level=09", async function () {
      expect(await mt.aprOf(1202109)).to.eq(5_997);
    });
    it("should return 7.996[%] for nft-level=12", async function () {
      expect(await mt.aprOf(1202112)).to.eq(7_996);
    });
    it("should return 9.995[%] for nft-level=15", async function () {
      expect(await mt.aprOf(1202115)).to.eq(9_995);
    });
    it("should return 11.994[%] for nft-level=18", async function () {
      expect(await mt.aprOf(1202118)).to.eq(11_994);
    });
    it("should return 13.993[%] for nft-level=21", async function () {
      expect(await mt.aprOf(1202121)).to.eq(13_993);
    });
    it("should return 15.992[%] for nft-level=24", async function () {
      expect(await mt.aprOf(1202124)).to.eq(15_992);
    });
  });
});
