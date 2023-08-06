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
  describe("apr+target (i.e rewards ~ age.year**2)", async function () {
    const full_year = new Date().getFullYear();
    const positive = (n) => (n > 0 ? n : 0);
    for (let dy = 0; dy < 10; dy++) {
      for (let y = 2021; y < 2031; y++) {
        const now_year = dy + full_year;
        const rate = positive(now_year - y) * 10_000;
        const rate_padded = String(rate).padStart(6, "0");
        it(`should return 0.${rate_padded}[%] for nft-year=${y} & now-year=${now_year}`, async () => {
          Expect(await mty.apbTargetOf(ppt.idBy(y, 0))).to.eq([rate, 1e6]);
          Expect(await mty.apbTargetOf(ppt.idBy(y, 3))).to.eq([rate, 1e6]);
          Expect(await mty.apbTargetOf(ppt.idBy(y, 6))).to.eq([rate, 1e6]);
          Expect(await mty.apbTargetOf(ppt.idBy(y, 9))).to.eq([rate, 1e6]);
          Expect(await mty.apbTargetOf(ppt.idBy(y, 12))).to.eq([rate, 1e6]);
          Expect(await mty.apbTargetOf(ppt.idBy(y, 15))).to.eq([rate, 1e6]);
          Expect(await mty.apbTargetOf(ppt.idBy(y, 18))).to.eq([rate, 1e6]);
          Expect(await mty.apbTargetOf(ppt.idBy(y, 21))).to.eq([rate, 1e6]);
          Expect(await mty.apbTargetOf(ppt.idBy(y, 24))).to.eq([rate, 1e6]);
        });
      }
      it(`should forward time by one year`, async function () {
        await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
        await network.provider.send("evm_mine", []);
      });
    }
  });
});
function Expect(big_numbers) {
  return expect(big_numbers.map((bn) => bn.toNumber())).deep;
}
