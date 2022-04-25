/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower, Nft, NftStaked, NftTreasury, MoeTreasury; // contracts
let xpower, nft, nft_staked, nft_treasury, moe_treasury; // instances

const NFT_ODIN_URL = "https://xpowermine.com/nfts/odin/{id}.json";
const NONE_ADDRESS = "0x0000000000000000000000000000000000000000";
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
    XPower = await ethers.getContractFactory("XPowerOdinTest");
    expect(XPower).to.exist;
  });
  before(async function () {
    Nft = await ethers.getContractFactory("XPowerOdinNft");
    expect(Nft).to.exist;
    NftStaked = await ethers.getContractFactory("XPowerOdinNftStaked");
    expect(NftStaked).to.exist;
    NftTreasury = await ethers.getContractFactory("NftTreasury");
    expect(NftTreasury).to.exist;
    MoeTreasury = await ethers.getContractFactory("MoeTreasury");
    expect(MoeTreasury).to.exist;
  });
  before(async function () {
    xpower = await XPower.deploy(NONE_ADDRESS, DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
    await xpower.init();
  });
  before(async function () {
    nft = await Nft.deploy(
      NFT_ODIN_URL,
      NONE_ADDRESS,
      DEADLINE,
      xpower.address
    );
    expect(nft).to.exist;
    await nft.deployed();
    nft_staked = await NftStaked.deploy(NFT_ODIN_URL, NONE_ADDRESS, DEADLINE);
    expect(nft_staked).to.exist;
    await nft_staked.deployed();
    nft_treasury = await NftTreasury.deploy(nft.address, nft_staked.address);
    expect(nft_treasury).to.exist;
    await nft_treasury.deployed();
    moe_treasury = await MoeTreasury.deploy(xpower.address, nft_staked.address);
    expect(moe_treasury).to.exist;
    await moe_treasury.deployed();
  });
  describe("apr", async function () {
    it("should return 00[%] for nft-level=00", async function () {
      expect(await moe_treasury.aprOf(202100)).to.eq(0);
      expect(await moe_treasury.aprOf(202200)).to.eq(0);
    });
    it("should return 03[%] for nft-level=03", async function () {
      expect(await moe_treasury.aprOf(202103)).to.eq(3);
      expect(await moe_treasury.aprOf(202203)).to.eq(3);
    });
    it("should return 06[%] for nft-level=06", async function () {
      expect(await moe_treasury.aprOf(202106)).to.eq(6);
      expect(await moe_treasury.aprOf(202206)).to.eq(6);
    });
    it("should return 09[%] for nft-level=09", async function () {
      expect(await moe_treasury.aprOf(202109)).to.eq(9);
      expect(await moe_treasury.aprOf(202209)).to.eq(9);
    });
    it("should return 12[%] for nft-level=12", async function () {
      expect(await moe_treasury.aprOf(202112)).to.eq(12);
      expect(await moe_treasury.aprOf(202212)).to.eq(12);
    });
    it("should return 15[%] for nft-level=15", async function () {
      expect(await moe_treasury.aprOf(202115)).to.eq(15);
      expect(await moe_treasury.aprOf(202215)).to.eq(15);
    });
    it("should return 18[%] for nft-level=18", async function () {
      expect(await moe_treasury.aprOf(202118)).to.eq(18);
      expect(await moe_treasury.aprOf(202218)).to.eq(18);
    });
    it("should return 21[%] for nft-level=21", async function () {
      expect(await moe_treasury.aprOf(202121)).to.eq(21);
      expect(await moe_treasury.aprOf(202221)).to.eq(21);
    });
    it("should return 24[%] for nft-level=24", async function () {
      expect(await moe_treasury.aprOf(202124)).to.eq(24);
      expect(await moe_treasury.aprOf(202224)).to.eq(24);
    });
  });
  describe("apr-bonus", async function () {
    const full_year = new Date().getFullYear();
    const positive = (n) => (n > 0 ? n : 0);
    for (let dy = 0; dy < 10; dy++) {
      for (let y = 2021; y < 2031; y++) {
        const now_year = dy + full_year;
        const rate = positive(now_year - y);
        const rate_padded = String(rate).padStart(2, "0");
        it(`should return ${rate_padded}[%] for nft-year=${y} & now-year=${now_year}`, async () => {
          expect(await moe_treasury.aprBonusOf(nft.idBy(y, 0))).to.eq(rate);
          expect(await moe_treasury.aprBonusOf(nft.idBy(y, 3))).to.eq(rate);
          expect(await moe_treasury.aprBonusOf(nft.idBy(y, 6))).to.eq(rate);
          expect(await moe_treasury.aprBonusOf(nft.idBy(y, 9))).to.eq(rate);
          expect(await moe_treasury.aprBonusOf(nft.idBy(y, 12))).to.eq(rate);
          expect(await moe_treasury.aprBonusOf(nft.idBy(y, 15))).to.eq(rate);
          expect(await moe_treasury.aprBonusOf(nft.idBy(y, 18))).to.eq(rate);
          expect(await moe_treasury.aprBonusOf(nft.idBy(y, 21))).to.eq(rate);
          expect(await moe_treasury.aprBonusOf(nft.idBy(y, 24))).to.eq(rate);
        });
      }
      it(`should forward time by one year`, async function () {
        await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
        await network.provider.send("evm_mine", []);
      });
    }
  });
});
