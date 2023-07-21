/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Nft; // contracts
let moe, nft; // instances

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
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
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.exist;
    Moe = await ethers.getContractFactory("XPower");
    expect(Moe).to.exist;
  });
  beforeEach(async function () {
    moe = await Moe.deploy([], DEADLINE);
    expect(moe).to.exist;
    await moe.deployed();
    await moe.transferOwnership(addresses[1]);
    await moe.init();
  });
  beforeEach(async function () {
    nft = await Nft.deploy(moe.address, NFT_XPOW_URL, [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
  });
  describe("levelOf", async function () {
    it(`should return level for 2021LL`, async () => {
      expect(await nft.levelOf(202103)).to.eq(3);
      expect(await nft.levelOf(202100)).to.eq(0);
      expect(await nft.levelOf(202106)).to.eq(6);
      expect(await nft.levelOf(202109)).to.eq(9);
      expect(await nft.levelOf(202112)).to.eq(12);
      expect(await nft.levelOf(202115)).to.eq(15);
      expect(await nft.levelOf(202118)).to.eq(18);
      expect(await nft.levelOf(202121)).to.eq(21);
      expect(await nft.levelOf(202124)).to.eq(24);
    });
    it(`should return level for 9876LL`, async () => {
      expect(await nft.levelOf(987600)).to.eq(0);
      expect(await nft.levelOf(987603)).to.eq(3);
      expect(await nft.levelOf(987606)).to.eq(6);
      expect(await nft.levelOf(987609)).to.eq(9);
      expect(await nft.levelOf(987612)).to.eq(12);
      expect(await nft.levelOf(987615)).to.eq(15);
      expect(await nft.levelOf(987618)).to.eq(18);
      expect(await nft.levelOf(987621)).to.eq(21);
      expect(await nft.levelOf(987624)).to.eq(24);
    });
    it(`should return level for 987654LL`, async () => {
      expect(await nft.levelOf(98765400)).to.eq(0);
      expect(await nft.levelOf(98765403)).to.eq(3);
      expect(await nft.levelOf(98765406)).to.eq(6);
      expect(await nft.levelOf(98765409)).to.eq(9);
      expect(await nft.levelOf(98765412)).to.eq(12);
      expect(await nft.levelOf(98765415)).to.eq(15);
      expect(await nft.levelOf(98765418)).to.eq(18);
      expect(await nft.levelOf(98765421)).to.eq(21);
      expect(await nft.levelOf(98765424)).to.eq(24);
    });
    it(`should return level for 98765432LL`, async () => {
      expect(await nft.levelOf(9876543200)).to.eq(0);
      expect(await nft.levelOf(9876543203)).to.eq(3);
      expect(await nft.levelOf(9876543206)).to.eq(6);
      expect(await nft.levelOf(9876543209)).to.eq(9);
      expect(await nft.levelOf(9876543212)).to.eq(12);
      expect(await nft.levelOf(9876543215)).to.eq(15);
      expect(await nft.levelOf(9876543218)).to.eq(18);
      expect(await nft.levelOf(9876543221)).to.eq(21);
      expect(await nft.levelOf(9876543224)).to.eq(24);
    });
  });
  describe("yearOf", async function () {
    it(`should return 2021 for 2021LL`, async () => {
      expect(await nft.yearOf(202100)).to.eq(2021);
      expect(await nft.yearOf(202103)).to.eq(2021);
      expect(await nft.yearOf(202106)).to.eq(2021);
      expect(await nft.yearOf(202109)).to.eq(2021);
      expect(await nft.yearOf(202112)).to.eq(2021);
      expect(await nft.yearOf(202115)).to.eq(2021);
      expect(await nft.yearOf(202118)).to.eq(2021);
      expect(await nft.yearOf(202121)).to.eq(2021);
      expect(await nft.yearOf(202124)).to.eq(2021);
    });
    it(`should return 9876 for 9876LL`, async () => {
      expect(await nft.yearOf(987600)).to.eq(9876);
      expect(await nft.yearOf(987603)).to.eq(9876);
      expect(await nft.yearOf(987606)).to.eq(9876);
      expect(await nft.yearOf(987609)).to.eq(9876);
      expect(await nft.yearOf(987612)).to.eq(9876);
      expect(await nft.yearOf(987615)).to.eq(9876);
      expect(await nft.yearOf(987618)).to.eq(9876);
      expect(await nft.yearOf(987621)).to.eq(9876);
      expect(await nft.yearOf(987624)).to.eq(9876);
    });
    it(`should return 987654 for 987654LL`, async () => {
      expect(await nft.yearOf(98765400)).to.eq(987654);
      expect(await nft.yearOf(98765403)).to.eq(987654);
      expect(await nft.yearOf(98765406)).to.eq(987654);
      expect(await nft.yearOf(98765409)).to.eq(987654);
      expect(await nft.yearOf(98765412)).to.eq(987654);
      expect(await nft.yearOf(98765415)).to.eq(987654);
      expect(await nft.yearOf(98765418)).to.eq(987654);
      expect(await nft.yearOf(98765421)).to.eq(987654);
      expect(await nft.yearOf(98765424)).to.eq(987654);
    });
    it(`should return 98765432 for 98765432LL`, async () => {
      expect(await nft.yearOf(9876543200)).to.eq(98765432);
      expect(await nft.yearOf(9876543203)).to.eq(98765432);
      expect(await nft.yearOf(9876543206)).to.eq(98765432);
      expect(await nft.yearOf(9876543209)).to.eq(98765432);
      expect(await nft.yearOf(9876543212)).to.eq(98765432);
      expect(await nft.yearOf(9876543215)).to.eq(98765432);
      expect(await nft.yearOf(9876543218)).to.eq(98765432);
      expect(await nft.yearOf(9876543221)).to.eq(98765432);
      expect(await nft.yearOf(9876543224)).to.eq(98765432);
    });
  });
});
