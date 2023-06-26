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
const MONTH = 2_629_800; // [seconds]

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
  describe("grant-role", async function () {
    it(`should grant reparametrization right`, async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
    });
  });
  describe("set-apr", async function () {
    it("should reparameterize at 1[%] (per nft.level)", async function () {
      const array = [0, 3, 1000000];
      expect(await mty.setAPRBatch([1202103], array)).to.not.eq(undefined);
    });
    it("should forward time by one month", async function () {
      await network.provider.send("evm_increaseTime", [MONTH]);
      await network.provider.send("evm_mine", []);
    });
  });
  describe("set-apr", async function () {
    it("should reparameterize at 2[%] (per nft.level)", async function () {
      const array = [0, 3, 2000000];
      expect(await mty.setAPRBatch([1202103], array)).to.not.eq(undefined);
    });
    for (let m = 1; m <= 24 * 4; m++) {
      it("should print current & target values", async function () {
        const tgt = (await mty.aprTargetOf(1202103)).toString();
        const apr = (await mty.aprOf(1202103)).toString();
        console.debug("[APR]", m, apr, tgt);
      });
      it("should forward time by one month", async function () {
        await network.provider.send("evm_increaseTime", [MONTH / 4]);
        await network.provider.send("evm_mine", []);
      });
    }
  });
});
