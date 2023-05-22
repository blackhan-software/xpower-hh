/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower, XPowerNft; // contracts
let xpower, xpower_nft; // instances

const NFT_LOKI_URL = "https://xpowermine.com/nfts/loki/{id}.json";
const DEADLINE = 0; // [seconds]

describe("XPowerNft", async function () {
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
    XPowerNft = await ethers.getContractFactory("XPowerNft");
    expect(XPowerNft).to.exist;
    XPower = await ethers.getContractFactory("XPowerLoki");
    expect(XPower).to.exist;
  });
  beforeEach(async function () {
    xpower = await XPower.deploy([], DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
    await xpower.transferOwnership(addresses[1]);
    await xpower.init();
  });
  beforeEach(async function () {
    xpower_nft = await XPowerNft.deploy(
      NFT_LOKI_URL,
      [xpower.address],
      [],
      DEADLINE
    );
    expect(xpower_nft).to.exist;
    await xpower_nft.deployed();
  });
  describe("levelOf", async function () {
    it(`should return level for 12021LL`, async () => {
      expect(await xpower_nft.levelOf(1202100)).to.eq(0);
      expect(await xpower_nft.levelOf(1202103)).to.eq(3);
      expect(await xpower_nft.levelOf(1202106)).to.eq(6);
      expect(await xpower_nft.levelOf(1202109)).to.eq(9);
      expect(await xpower_nft.levelOf(1202112)).to.eq(12);
      expect(await xpower_nft.levelOf(1202115)).to.eq(15);
      expect(await xpower_nft.levelOf(1202118)).to.eq(18);
      expect(await xpower_nft.levelOf(1202121)).to.eq(21);
      expect(await xpower_nft.levelOf(1202124)).to.eq(24);
    });
    it(`should return level for 19876LL`, async () => {
      expect(await xpower_nft.levelOf(2987600)).to.eq(0);
      expect(await xpower_nft.levelOf(2987603)).to.eq(3);
      expect(await xpower_nft.levelOf(2987606)).to.eq(6);
      expect(await xpower_nft.levelOf(2987609)).to.eq(9);
      expect(await xpower_nft.levelOf(2987612)).to.eq(12);
      expect(await xpower_nft.levelOf(2987615)).to.eq(15);
      expect(await xpower_nft.levelOf(2987618)).to.eq(18);
      expect(await xpower_nft.levelOf(2987621)).to.eq(21);
      expect(await xpower_nft.levelOf(2987624)).to.eq(24);
    });
    it(`should return level for 1987654LL`, async () => {
      expect(await xpower_nft.levelOf(398765400)).to.eq(0);
      expect(await xpower_nft.levelOf(398765403)).to.eq(3);
      expect(await xpower_nft.levelOf(398765406)).to.eq(6);
      expect(await xpower_nft.levelOf(398765409)).to.eq(9);
      expect(await xpower_nft.levelOf(398765412)).to.eq(12);
      expect(await xpower_nft.levelOf(398765415)).to.eq(15);
      expect(await xpower_nft.levelOf(398765418)).to.eq(18);
      expect(await xpower_nft.levelOf(398765421)).to.eq(21);
      expect(await xpower_nft.levelOf(398765424)).to.eq(24);
    });
    it(`should return level for 198765432LL`, async () => {
      expect(await xpower_nft.levelOf(49876543200)).to.eq(0);
      expect(await xpower_nft.levelOf(49876543203)).to.eq(3);
      expect(await xpower_nft.levelOf(49876543206)).to.eq(6);
      expect(await xpower_nft.levelOf(49876543209)).to.eq(9);
      expect(await xpower_nft.levelOf(49876543212)).to.eq(12);
      expect(await xpower_nft.levelOf(49876543215)).to.eq(15);
      expect(await xpower_nft.levelOf(49876543218)).to.eq(18);
      expect(await xpower_nft.levelOf(49876543221)).to.eq(21);
      expect(await xpower_nft.levelOf(49876543224)).to.eq(24);
    });
  });
  describe("yearOf", async function () {
    it(`should return 2021 for 12021LL`, async () => {
      expect(await xpower_nft.yearOf(1202100)).to.eq(2021);
      expect(await xpower_nft.yearOf(1202103)).to.eq(2021);
      expect(await xpower_nft.yearOf(1202106)).to.eq(2021);
      expect(await xpower_nft.yearOf(1202109)).to.eq(2021);
      expect(await xpower_nft.yearOf(1202112)).to.eq(2021);
      expect(await xpower_nft.yearOf(1202115)).to.eq(2021);
      expect(await xpower_nft.yearOf(1202118)).to.eq(2021);
      expect(await xpower_nft.yearOf(1202121)).to.eq(2021);
      expect(await xpower_nft.yearOf(1202124)).to.eq(2021);
    });
    it(`should return 9876 for 19876LL`, async () => {
      expect(await xpower_nft.yearOf(2987600)).to.eq(9876);
      expect(await xpower_nft.yearOf(2987603)).to.eq(9876);
      expect(await xpower_nft.yearOf(2987606)).to.eq(9876);
      expect(await xpower_nft.yearOf(2987609)).to.eq(9876);
      expect(await xpower_nft.yearOf(2987612)).to.eq(9876);
      expect(await xpower_nft.yearOf(2987615)).to.eq(9876);
      expect(await xpower_nft.yearOf(2987618)).to.eq(9876);
      expect(await xpower_nft.yearOf(2987621)).to.eq(9876);
      expect(await xpower_nft.yearOf(2987624)).to.eq(9876);
    });
    it(`should return 987654 for 1987654LL`, async () => {
      expect(await xpower_nft.yearOf(398765400)).to.eq(987654);
      expect(await xpower_nft.yearOf(398765403)).to.eq(987654);
      expect(await xpower_nft.yearOf(398765406)).to.eq(987654);
      expect(await xpower_nft.yearOf(398765409)).to.eq(987654);
      expect(await xpower_nft.yearOf(398765412)).to.eq(987654);
      expect(await xpower_nft.yearOf(398765415)).to.eq(987654);
      expect(await xpower_nft.yearOf(398765418)).to.eq(987654);
      expect(await xpower_nft.yearOf(398765421)).to.eq(987654);
      expect(await xpower_nft.yearOf(398765424)).to.eq(987654);
    });
    it(`should return 98765432 for 198765432LL`, async () => {
      expect(await xpower_nft.yearOf(49876543200)).to.eq(98765432);
      expect(await xpower_nft.yearOf(49876543203)).to.eq(98765432);
      expect(await xpower_nft.yearOf(49876543206)).to.eq(98765432);
      expect(await xpower_nft.yearOf(49876543209)).to.eq(98765432);
      expect(await xpower_nft.yearOf(49876543212)).to.eq(98765432);
      expect(await xpower_nft.yearOf(49876543215)).to.eq(98765432);
      expect(await xpower_nft.yearOf(49876543218)).to.eq(98765432);
      expect(await xpower_nft.yearOf(49876543221)).to.eq(98765432);
      expect(await xpower_nft.yearOf(49876543224)).to.eq(98765432);
    });
  });
  describe("prefixOf", async function () {
    it(`should return 1 for 12021LL`, async () => {
      expect(await xpower_nft.prefixOf(1202100)).to.eq(1);
      expect(await xpower_nft.prefixOf(1202103)).to.eq(1);
      expect(await xpower_nft.prefixOf(1202106)).to.eq(1);
      expect(await xpower_nft.prefixOf(1202109)).to.eq(1);
      expect(await xpower_nft.prefixOf(1202112)).to.eq(1);
      expect(await xpower_nft.prefixOf(1202115)).to.eq(1);
      expect(await xpower_nft.prefixOf(1202118)).to.eq(1);
      expect(await xpower_nft.prefixOf(1202121)).to.eq(1);
      expect(await xpower_nft.prefixOf(1202124)).to.eq(1);
    });
    it(`should return 2 for 19876LL`, async () => {
      expect(await xpower_nft.prefixOf(2987600)).to.eq(2);
      expect(await xpower_nft.prefixOf(2987603)).to.eq(2);
      expect(await xpower_nft.prefixOf(2987606)).to.eq(2);
      expect(await xpower_nft.prefixOf(2987609)).to.eq(2);
      expect(await xpower_nft.prefixOf(2987612)).to.eq(2);
      expect(await xpower_nft.prefixOf(2987615)).to.eq(2);
      expect(await xpower_nft.prefixOf(2987618)).to.eq(2);
      expect(await xpower_nft.prefixOf(2987621)).to.eq(2);
      expect(await xpower_nft.prefixOf(2987624)).to.eq(2);
    });
    it(`should return 3 for 1987654LL`, async () => {
      expect(await xpower_nft.prefixOf(398765400)).to.eq(3);
      expect(await xpower_nft.prefixOf(398765403)).to.eq(3);
      expect(await xpower_nft.prefixOf(398765406)).to.eq(3);
      expect(await xpower_nft.prefixOf(398765409)).to.eq(3);
      expect(await xpower_nft.prefixOf(398765412)).to.eq(3);
      expect(await xpower_nft.prefixOf(398765415)).to.eq(3);
      expect(await xpower_nft.prefixOf(398765418)).to.eq(3);
      expect(await xpower_nft.prefixOf(398765421)).to.eq(3);
      expect(await xpower_nft.prefixOf(398765424)).to.eq(3);
    });
    it(`should return 4 for 198765432LL`, async () => {
      expect(await xpower_nft.prefixOf(49876543200)).to.eq(4);
      expect(await xpower_nft.prefixOf(49876543203)).to.eq(4);
      expect(await xpower_nft.prefixOf(49876543206)).to.eq(4);
      expect(await xpower_nft.prefixOf(49876543209)).to.eq(4);
      expect(await xpower_nft.prefixOf(49876543212)).to.eq(4);
      expect(await xpower_nft.prefixOf(49876543215)).to.eq(4);
      expect(await xpower_nft.prefixOf(49876543218)).to.eq(4);
      expect(await xpower_nft.prefixOf(49876543221)).to.eq(4);
      expect(await xpower_nft.prefixOf(49876543224)).to.eq(4);
    });
  });
});
