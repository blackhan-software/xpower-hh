const { ethers, network } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Sov, Nft, Ppt, Mty, Nty; // contracts
let moe, sov, nft, ppt, mty, nty; // instances

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
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
    moe = await Moe.deploy([], DEADLINE);
    expect(moe).to.be.an("object");
    await moe.init();
    sov = await Sov.deploy(moe.target, [], DEADLINE);
    expect(sov).to.be.an("object");
  });
  before(async function () {
    nft = await Nft.deploy(moe.target, NFT_XPOW_URL, [], DEADLINE);
    expect(nft).to.be.an("object");
    ppt = await Ppt.deploy(NFT_XPOW_URL, [], DEADLINE);
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
  describe("apr-of (i.e rewards ~ nft-level)", async function () {
    it("should return 0[%] for nft-level=00", async function () {
      expect(await mty.aprOf(202100)).to.eq(0x0);
    });
    it("should return 1[%] for nft-level=03", async function () {
      expect(await mty.aprOf(202103)).to.eq(1e6);
    });
    it("should return 2[%] for nft-level=06", async function () {
      expect(await mty.aprOf(202106)).to.eq(2e6);
    });
    it("should return 3[%] for nft-level=09", async function () {
      expect(await mty.aprOf(202109)).to.eq(3e6);
    });
    it("should return 4[%] for nft-level=12", async function () {
      expect(await mty.aprOf(202112)).to.eq(4e6);
    });
    it("should return 5[%] for nft-level=15", async function () {
      expect(await mty.aprOf(202115)).to.eq(5e6);
    });
    it("should return 6[%] for nft-level=18", async function () {
      expect(await mty.aprOf(202118)).to.eq(6e6);
    });
    it("should return 7[%] for nft-level=21", async function () {
      expect(await mty.aprOf(202121)).to.eq(7e6);
    });
    it("should return 8[%] for nft-level=24", async function () {
      expect(await mty.aprOf(202124)).to.eq(8e6);
    });
  });
  describe("set-apr: **init** at 1[%]", async function () {
    it("should reparameterize", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(await mty.setAPR(202103, [0, 3, 1e6, 256])).to.be.an("object");
      expect(await mty.setAPR(202106, [0, 3, 1e6, 256])).to.be.an("object");
      expect(await mty.setAPR(202109, [0, 3, 1e6, 256])).to.be.an("object");
      expect(await mty.setAPR(202112, [0, 3, 1e6, 256])).to.be.an("object");
      expect(await mty.setAPR(202115, [0, 3, 1e6, 256])).to.be.an("object");
      expect(await mty.setAPR(202118, [0, 3, 1e6, 256])).to.be.an("object");
      expect(await mty.setAPR(202121, [0, 3, 1e6, 256])).to.be.an("object");
      expect(await mty.setAPR(202124, [0, 3, 1e6, 256])).to.be.an("object");
    });
  });
  describe("set-apr (double from 1[%] to 2[%])", async function () {
    it("should forward time by one year", async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
      await network.provider.send("evm_mine", []);
    });
    it("should *not* reparameterize (too large)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(202103, [0, 3, 2e6 + 1, 256]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too large)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(202103, [1e6 + 1, 3, 1e6, 256]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too small)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(202103, [0, 3, 0.5e6 - 1, 256]).catch((ex) => {
          const m = ex.message.match(/invalid change: too small/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
    it("should reparameterize APR at 2[%]", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(await mty.setAPR(202103, [0, 3, 2e6, 256])).to.be.an("object");
      expect(await mty.setAPR(202106, [0, 3, 2e6, 256])).to.be.an("object");
      expect(await mty.setAPR(202109, [0, 3, 2e6, 256])).to.be.an("object");
      expect(await mty.setAPR(202112, [0, 3, 2e6, 256])).to.be.an("object");
      expect(await mty.setAPR(202115, [0, 3, 2e6, 256])).to.be.an("object");
      expect(await mty.setAPR(202118, [0, 3, 2e6, 256])).to.be.an("object");
      expect(await mty.setAPR(202121, [0, 3, 2e6, 256])).to.be.an("object");
      expect(await mty.setAPR(202124, [0, 3, 2e6, 256])).to.be.an("object");
    });
    it("should *not* reparameterize (too frequent)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(202103, [0, 3, 1e6, 256]).catch((ex) => {
          const m = ex.message.match(/invalid change: too frequent/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it("should forward time by 0.25 year", async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.0[%] for nft-level=00", async function () {
      expect(await mty.aprOf(202100)).to.be.closeTo(0x0, 1);
    });
    it("should return 1.2[%] for nft-level=03", async function () {
      expect(await mty.aprOf(202103)).to.be.closeTo(1.2e6, 1);
    });
    it("should return 2.4[%] for nft-level=06", async function () {
      expect(await mty.aprOf(202106)).to.be.closeTo(2.4e6, 1);
    });
    it("should return 3.6[%] for nft-level=09", async function () {
      expect(await mty.aprOf(202109)).to.be.closeTo(3.6e6, 1);
    });
    it("should return 4.8[%] for nft-level=12", async function () {
      expect(await mty.aprOf(202112)).to.be.closeTo(4.8e6, 1);
    });
    it("should return 6[%] for nft-level=15", async function () {
      expect(await mty.aprOf(202115)).to.be.closeTo(6.0e6, 1);
    });
    it("should return 7.2[%] for nft-level=18", async function () {
      expect(await mty.aprOf(202118)).to.be.closeTo(7.2e6, 1);
    });
    it("should return 8.4[%] for nft-level=21", async function () {
      expect(await mty.aprOf(202121)).to.be.closeTo(8.4e6, 1);
    });
    it("should return 9.6[%] for nft-level=24", async function () {
      expect(await mty.aprOf(202124)).to.be.closeTo(9.6e6, 1);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it("should forward time by 0.25 year", async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      expect(await mty.aprOf(202100)).to.be.closeTo(0x0, 1);
    });
    it("should return 1.333333[%] for nft-level=03", async function () {
      expect(await mty.aprOf(202103)).to.be.closeTo(1.333333e6, 1);
    });
    it("should return 2.666666[%] for nft-level=06", async function () {
      expect(await mty.aprOf(202106)).to.be.closeTo(2.666666e6, 1);
    });
    it("should return 3.999999[%] for nft-level=09", async function () {
      expect(await mty.aprOf(202109)).to.be.closeTo(3.999999e6, 1);
    });
    it("should return 5_333333[%] for nft-level=12", async function () {
      expect(await mty.aprOf(202112)).to.be.closeTo(5.333333e6, 1);
    });
    it("should return 6.666666[%] for nft-level=15", async function () {
      expect(await mty.aprOf(202115)).to.be.closeTo(6.666666e6, 1);
    });
    it("should return 7.999999[%] for nft-level=18", async function () {
      expect(await mty.aprOf(202118)).to.be.closeTo(7.999999e6, 1);
    });
    it("should return 9.333332[%] for nft-level=21", async function () {
      expect(await mty.aprOf(202121)).to.be.closeTo(9.333332e6, 1);
    });
    it("should return 10.666666[%] for nft-level=24", async function () {
      expect(await mty.aprOf(202124)).to.be.closeTo(10.666666e6, 1);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it("should forward time by 0.25 year", async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      expect(await mty.aprOf(202100)).to.be.closeTo(0x0, 1);
    });
    it("should return 1.428571[%] for nft-level=03", async function () {
      expect(await mty.aprOf(202103)).to.be.closeTo(1.428571e6, 1);
    });
    it("should return 2.857142[%] for nft-level=06", async function () {
      expect(await mty.aprOf(202106)).to.be.closeTo(2.857142e6, 1);
    });
    it("should return 4.285714[%] for nft-level=09", async function () {
      expect(await mty.aprOf(202109)).to.be.closeTo(4.285714e6, 1);
    });
    it("should return 5.714285[%] for nft-level=12", async function () {
      expect(await mty.aprOf(202112)).to.be.closeTo(5.714285e6, 1);
    });
    it("should return 7.142856[%] for nft-level=15", async function () {
      expect(await mty.aprOf(202115)).to.be.closeTo(7.142856e6, 1);
    });
    it("should return 8_571428[%] for nft-level=18", async function () {
      expect(await mty.aprOf(202118)).to.be.closeTo(8.571428e6, 1);
    });
    it("should return 9.999999[%] for nft-level=21", async function () {
      expect(await mty.aprOf(202121)).to.be.closeTo(9.999999e6, 1);
    });
    it("should return 11.428570[%] for nft-level=24", async function () {
      expect(await mty.aprOf(202124)).to.be.closeTo(11.42857e6, 1);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it("should forward time by 0.25 years", async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      expect(await mty.aprOf(202100)).to.be.closeTo(0x0, 1);
    });
    it("should return 1.499999[%] for nft-level=03", async function () {
      expect(await mty.aprOf(202103)).to.be.closeTo(1.499999e6, 1);
    });
    it("should return 2.999999[%] for nft-level=06", async function () {
      expect(await mty.aprOf(202106)).to.be.closeTo(2.999999e6, 1);
    });
    it("should return 4.499999[%] for nft-level=09", async function () {
      expect(await mty.aprOf(202109)).to.be.closeTo(4.499999e6, 1);
    });
    it("should return 5.999999[%] for nft-level=12", async function () {
      expect(await mty.aprOf(202112)).to.be.closeTo(5.999999e6, 1);
    });
    it("should return 7.499999[%] for nft-level=15", async function () {
      expect(await mty.aprOf(202115)).to.be.closeTo(7.499999e6, 1);
    });
    it("should return 8.999999[%] for nft-level=18", async function () {
      expect(await mty.aprOf(202118)).to.be.closeTo(8.999999e6, 1);
    });
    it("should return 10.499999[%] for nft-level=21", async function () {
      expect(await mty.aprOf(202121)).to.be.closeTo(10.499999e6, 1);
    });
    it("should return 11.999999[%] for nft-level=24", async function () {
      expect(await mty.aprOf(202124)).to.be.closeTo(11.999999e6, 1);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it("should forward time by 999 years", async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 999]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      expect(await mty.aprOf(202100)).to.be.closeTo(0x0, 1);
    });
    it("should return 1.999000[%] for nft-level=03", async function () {
      expect(await mty.aprOf(202103)).to.be.closeTo(1.999e6, 1);
    });
    it("should return 3.998001[%] for nft-level=06", async function () {
      expect(await mty.aprOf(202106)).to.be.closeTo(3.998001e6, 1);
    });
    it("should return 5.997002[%] for nft-level=09", async function () {
      expect(await mty.aprOf(202109)).to.be.closeTo(5.997002e6, 1);
    });
    it("should return 7.996003[%] for nft-level=12", async function () {
      expect(await mty.aprOf(202112)).to.be.closeTo(7.996003e6, 1);
    });
    it("should return 9.995004[%] for nft-level=15", async function () {
      expect(await mty.aprOf(202115)).to.be.closeTo(9.995004e6, 1);
    });
    it("should return 11.994005[%] for nft-level=18", async function () {
      expect(await mty.aprOf(202118)).to.be.closeTo(11.994005e6, 1);
    });
    it("should return 13.993006[%] for nft-level=21", async function () {
      expect(await mty.aprOf(202121)).to.be.closeTo(13.993006e6, 1);
    });
    it("should return 15.992007[%] for nft-level=24", async function () {
      expect(await mty.aprOf(202124)).to.be.closeTo(15.992007e6, 1);
    });
  });
});
