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
  describe("apr+target (i.e rewards ~ age.year**2)", async function () {
    const full_year = new Date().getFullYear();
    const positive = (n) => (n > 0 ? n : 0);
    for (let dy = 0; dy < 10; dy++) {
      for (let y = 2021; y < 2031; y++) {
        const now_year = dy + full_year;
        const rate = positive(now_year - y) * 10_000;
        const rate_padded = String(rate).padStart(6, "0");
        it(`should return 0.${rate_padded}[%] for nft-year=${y} & now-year=${now_year}`, async () => {
          expect(await mty.apbTargetOf(ppt.idBy(y, 0))).to.eq(rate);
          expect(await mty.apbTargetOf(ppt.idBy(y, 3))).to.eq(rate);
          expect(await mty.apbTargetOf(ppt.idBy(y, 6))).to.eq(rate);
          expect(await mty.apbTargetOf(ppt.idBy(y, 9))).to.eq(rate);
          expect(await mty.apbTargetOf(ppt.idBy(y, 12))).to.eq(rate);
          expect(await mty.apbTargetOf(ppt.idBy(y, 15))).to.eq(rate);
          expect(await mty.apbTargetOf(ppt.idBy(y, 18))).to.eq(rate);
          expect(await mty.apbTargetOf(ppt.idBy(y, 21))).to.eq(rate);
          expect(await mty.apbTargetOf(ppt.idBy(y, 24))).to.eq(rate);
        });
      }
      it("should forward time by one year", async function () {
        await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
        await network.provider.send("evm_mine", []);
      });
    }
  });
});
