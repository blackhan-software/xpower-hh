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
    mty = await Mty.deploy(moe.address, sov.address, ppt.address);
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
      expect(await mty.aprsLength(202103)).to.eq(0);
      expect(await mty.aprsLength(202106)).to.eq(0);
      expect(await mty.aprsLength(202109)).to.eq(0);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level)", async function () {
    it("should return 0.000000[%] for nft-level=00", async function () {
      Expect(await mty.aprOf(202100)).to.eq([0x0, 1e6]);
    });
    it("should return 1.000000[%] for nft-level=03", async function () {
      Expect(await mty.aprOf(202103)).to.eq([1e6, 1e6]);
    });
    it("should return 2.000000[%] for nft-level=06", async function () {
      Expect(await mty.aprOf(202106)).to.eq([2e6, 1e6]);
    });
    it("should return 3.000000[%] for nft-level=09", async function () {
      Expect(await mty.aprOf(202109)).to.eq([3e6, 1e6]);
    });
    it("should return 4.000000[%] for nft-level=12", async function () {
      Expect(await mty.aprOf(202112)).to.eq([4e6, 1e6]);
    });
    it("should return 5.000000[%] for nft-level=15", async function () {
      Expect(await mty.aprOf(202115)).to.eq([5e6, 1e6]);
    });
    it("should return 6.000000[%] for nft-level=18", async function () {
      Expect(await mty.aprOf(202118)).to.eq([6e6, 1e6]);
    });
    it("should return 7.000000[%] for nft-level=21", async function () {
      Expect(await mty.aprOf(202121)).to.eq([7e6, 1e6]);
    });
    it("should return 8.000000[%] for nft-level=24", async function () {
      Expect(await mty.aprOf(202124)).to.eq([8e6, 1e6]);
    });
  });
  describe("set-apr (double from 1.000000[%] to 2.000000[%])", async function () {
    it(`should forward time by one year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
      await network.provider.send("evm_mine", []);
    });
    it("should *not* reparameterize (too large)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(202103, [0, 3, 2e6 + 1, 8]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too large)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(202103, [1e6 + 1, 3, 1e6, 8]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* reparameterize (too small)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(202103, [0, 3, 0.5e6 - 1, 8]).catch((ex) => {
          const m = ex.message.match(/invalid change: too small/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should reparameterize APR at 2.000000[%]", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(await mty.setAPR(202106, [0, 3, 2e6, 8])).to.be.an("object");
      expect(await mty.setAPR(202109, [0, 3, 2e6, 8])).to.be.an("object");
      expect(await mty.setAPR(202112, [0, 3, 2e6, 8])).to.be.an("object");
      expect(await mty.setAPR(202115, [0, 3, 2e6, 8])).to.be.an("object");
      expect(await mty.setAPR(202118, [0, 3, 2e6, 8])).to.be.an("object");
      expect(await mty.setAPR(202103, [0, 3, 2e6, 8])).to.be.an("object");
      expect(await mty.setAPR(202121, [0, 3, 2e6, 8])).to.be.an("object");
      expect(await mty.setAPR(202124, [0, 3, 2e6, 8])).to.be.an("object");
    });
    it("should *not* reparameterize (too frequent)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(202103, [0, 3, 1e6, 8]).catch((ex) => {
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
      Expect(await mty.aprOf(202100)).to.eq([0x0, 1e6]);
    });
    it("should return 2.000000[%] for nft-level=03", async function () {
      Expect(await mty.aprOf(202103)).to.eq([2e6, 1e6]);
    });
    it("should return 4.000000[%] for nft-level=06", async function () {
      Expect(await mty.aprOf(202106)).to.eq([4e6, 1e6]);
    });
    it("should return 6.000000[%] for nft-level=09", async function () {
      Expect(await mty.aprOf(202109)).to.eq([6e6, 1e6]);
    });
    it("should return 8.000000[%] for nft-level=12", async function () {
      Expect(await mty.aprOf(202112)).to.eq([8e6, 1e6]);
    });
    it("should return 10.000000[%] for nft-level=15", async function () {
      Expect(await mty.aprOf(202115)).to.eq([10e6, 1e6]);
    });
    it("should return 12.000000[%] for nft-level=18", async function () {
      Expect(await mty.aprOf(202118)).to.eq([12e6, 1e6]);
    });
    it("should return 14.000000[%] for nft-level=21", async function () {
      Expect(await mty.aprOf(202121)).to.eq([14e6, 1e6]);
    });
    it("should return 16.000000[%] for nft-level=24", async function () {
      Expect(await mty.aprOf(202124)).to.eq([16e6, 1e6]);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 0.25 year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      Expect(await mty.aprOf(202100)).to.eq([0x0, 1e6]);
    });
    it("should return 2.000000[%] for nft-level=03", async function () {
      Expect(await mty.aprOf(202103)).to.eq([2e6, 1e6]);
    });
    it("should return 4.000000[%] for nft-level=06", async function () {
      Expect(await mty.aprOf(202106)).to.eq([4e6, 1e6]);
    });
    it("should return 6.000000[%] for nft-level=09", async function () {
      Expect(await mty.aprOf(202109)).to.eq([6e6, 1e6]);
    });
    it("should return 8.000000[%] for nft-level=12", async function () {
      Expect(await mty.aprOf(202112)).to.eq([8e6, 1e6]);
    });
    it("should return 10.000000[%] for nft-level=15", async function () {
      Expect(await mty.aprOf(202115)).to.eq([10e6, 1e6]);
    });
    it("should return 12.000000[%] for nft-level=18", async function () {
      Expect(await mty.aprOf(202118)).to.eq([12e6, 1e6]);
    });
    it("should return 14.000000[%] for nft-level=21", async function () {
      Expect(await mty.aprOf(202121)).to.eq([14e6, 1e6]);
    });
    it("should return 16.000000[%] for nft-level=24", async function () {
      Expect(await mty.aprOf(202124)).to.eq([16e6, 1e6]);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 0.25 year`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      Expect(await mty.aprOf(202100)).to.eq([0x0, 1e6]);
    });
    it("should return 2.000000[%] for nft-level=03", async function () {
      Expect(await mty.aprOf(202103)).to.eq([2e6, 1e6]);
    });
    it("should return 4.000000[%] for nft-level=06", async function () {
      Expect(await mty.aprOf(202106)).to.eq([4e6, 1e6]);
    });
    it("should return 6.000000[%] for nft-level=09", async function () {
      Expect(await mty.aprOf(202109)).to.eq([6e6, 1e6]);
    });
    it("should return 8.000000[%] for nft-level=12", async function () {
      Expect(await mty.aprOf(202112)).to.eq([8e6, 1e6]);
    });
    it("should return 10.000000[%] for nft-level=15", async function () {
      Expect(await mty.aprOf(202115)).to.eq([10e6, 1e6]);
    });
    it("should return 12.000000[%] for nft-level=18", async function () {
      Expect(await mty.aprOf(202118)).to.eq([12e6, 1e6]);
    });
    it("should return 14.000000[%] for nft-level=21", async function () {
      Expect(await mty.aprOf(202121)).to.eq([14e6, 1e6]);
    });
    it("should return 16.000000[%] for nft-level=24", async function () {
      Expect(await mty.aprOf(202124)).to.eq([16e6, 1e6]);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 0.25 years`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.25]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      Expect(await mty.aprOf(202100)).to.eq([0x0, 1e6]);
    });
    it("should return 2.000000[%] for nft-level=03", async function () {
      Expect(await mty.aprOf(202103)).to.eq([2e6, 1e6]);
    });
    it("should return 4.000000[%] for nft-level=06", async function () {
      Expect(await mty.aprOf(202106)).to.eq([4e6, 1e6]);
    });
    it("should return 6.000000[%] for nft-level=09", async function () {
      Expect(await mty.aprOf(202109)).to.eq([6e6, 1e6]);
    });
    it("should return 8.000000[%] for nft-level=12", async function () {
      Expect(await mty.aprOf(202112)).to.eq([8e6, 1e6]);
    });
    it("should return 10.000000[%] for nft-level=15", async function () {
      Expect(await mty.aprOf(202115)).to.eq([10e6, 1e6]);
    });
    it("should return 12.000000[%] for nft-level=18", async function () {
      Expect(await mty.aprOf(202118)).to.eq([12e6, 1e6]);
    });
    it("should return 14.000000[%] for nft-level=21", async function () {
      Expect(await mty.aprOf(202121)).to.eq([14e6, 1e6]);
    });
    it("should return 16.000000[%] for nft-level=24", async function () {
      Expect(await mty.aprOf(202124)).to.eq([16e6, 1e6]);
    });
  });
  describe("apr-of (i.e rewards ~ nft-level × time)", async function () {
    it(`should forward time by 999 years`, async function () {
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 999]);
      await network.provider.send("evm_mine", []);
    });
    it("should return 0.000000[%] for nft-level=00", async function () {
      Expect(await mty.aprOf(202100)).to.eq([0x0, 1e6]);
    });
    it("should return 2.000000[%] for nft-level=03", async function () {
      Expect(await mty.aprOf(202103)).to.eq([2e6, 1e6]);
    });
    it("should return 4.000000[%] for nft-level=06", async function () {
      Expect(await mty.aprOf(202106)).to.eq([4e6, 1e6]);
    });
    it("should return 6.000000[%] for nft-level=09", async function () {
      Expect(await mty.aprOf(202109)).to.eq([6e6, 1e6]);
    });
    it("should return 8.000000[%] for nft-level=12", async function () {
      Expect(await mty.aprOf(202112)).to.eq([8e6, 1e6]);
    });
    it("should return 10.000000[%] for nft-level=15", async function () {
      Expect(await mty.aprOf(202115)).to.eq([10e6, 1e6]);
    });
    it("should return 12.000000[%] for nft-level=18", async function () {
      Expect(await mty.aprOf(202118)).to.eq([12e6, 1e6]);
    });
    it("should return 14.000000[%] for nft-level=21", async function () {
      Expect(await mty.aprOf(202121)).to.eq([14e6, 1e6]);
    });
    it("should return 16.000000[%] for nft-level=24", async function () {
      Expect(await mty.aprOf(202124)).to.eq([16e6, 1e6]);
    });
  });
  describe("aprs-length", async function () {
    it("should return a list of length=1", async function () {
      expect(await mty.aprsLength(202103)).to.eq(1);
      expect(await mty.aprsLength(202106)).to.eq(1);
      expect(await mty.aprsLength(202109)).to.eq(1);
    });
  });
});
function Expect(big_numbers) {
  return expect(big_numbers.map((bn) => bn.toNumber())).deep;
}
