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
  describe("apr+target (i.e rewards ~ age.year**2)", async function () {
    const full_year = new Date().getFullYear();
    const positive = (n) => (n > 0 ? n : 0);
    for (let dy = 0; dy < 10; dy++) {
      for (let y = 2021; y < 2031; y++) {
        const now_year = dy + full_year;
        const rate = positive(now_year - y) * 10;
        const rate_padded = String(rate).padStart(3, "0");
        it(`should return 0.${rate_padded}[%] for nft-year=${y} & now-year=${now_year}`, async () => {
          expect(await mt.aprBonusTargetOf(ppt.idBy(y, 0, 1))).to.eq(rate);
          expect(await mt.aprBonusTargetOf(ppt.idBy(y, 3, 1))).to.eq(rate);
          expect(await mt.aprBonusTargetOf(ppt.idBy(y, 6, 1))).to.eq(rate);
          expect(await mt.aprBonusTargetOf(ppt.idBy(y, 9, 1))).to.eq(rate);
          expect(await mt.aprBonusTargetOf(ppt.idBy(y, 12, 1))).to.eq(rate);
          expect(await mt.aprBonusTargetOf(ppt.idBy(y, 15, 1))).to.eq(rate);
          expect(await mt.aprBonusTargetOf(ppt.idBy(y, 18, 1))).to.eq(rate);
          expect(await mt.aprBonusTargetOf(ppt.idBy(y, 21, 1))).to.eq(rate);
          expect(await mt.aprBonusTargetOf(ppt.idBy(y, 24, 1))).to.eq(rate);
        });
      }
      it(`should forward time by one year`, async function () {
        await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
        await network.provider.send("evm_mine", []);
      });
    }
  });
});
