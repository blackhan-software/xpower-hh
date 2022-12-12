/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower, XPowerNft; // contracts
let xpower, xpower_nft; // instances
let UNUM; // decimals

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const NFT_LOKI_WWW = "https://www.xpowermine.com/nfts/loki/{id}.json";
const NFT_LOKI_URL = "https://xpowermine.com/nfts/loki/{id}.json";
const DEADLINE = 0; // [seconds]

let UNIT;

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
    XPowerNft = await ethers.getContractFactory("XPowerLokiNft");
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
    table = await new HashTable(xpower, addresses[0]).init();
  });
  beforeEach(async function () {
    const decimals = await xpower.decimals();
    expect(decimals).to.greaterThan(0);
    UNUM = 10n ** BigInt(decimals);
    expect(UNUM >= 1n).to.be.true;
  });
  beforeEach(async function () {
    xpower_nft = await XPowerNft.deploy(
      NFT_LOKI_URL,
      xpower.address,
      [],
      DEADLINE
    );
    expect(xpower_nft).to.exist;
    await xpower_nft.deployed();
  });
  beforeEach(async function () {
    UNIT = (await xpower_nft.UNIT()).toNumber();
    expect(UNIT).to.be.a("number").and.to.eq(0);
  });
  after(async function () {
    const [owner, signer_1] = await ethers.getSigners();
    await xpower.connect(signer_1).transferOwnership(owner.address);
  });
  describe("setURI", function () {
    it("should set new URI", async function () {
      await xpower_nft.grantRole(xpower_nft.URI_DATA_ROLE(), addresses[0]);
      const nft_year = (await xpower_nft.year()).toNumber();
      expect(nft_year).to.be.greaterThan(0);
      const nft_id = (await xpower_nft.idBy(nft_year, UNIT)).toNumber();
      expect(nft_id).to.be.greaterThan(0);
      await xpower_nft.setURI(NFT_LOKI_WWW);
      const nft_url = await xpower_nft.uri(nft_id);
      expect(nft_url).to.eq(NFT_LOKI_WWW);
    });
    it("should *not* set new URI (account is missing role)", async function () {
      await xpower_nft.revokeRole(xpower_nft.URI_DATA_ROLE(), addresses[0]);
      const nft_year = (await xpower_nft.year()).toNumber();
      expect(nft_year).to.be.greaterThan(0);
      const nft_id = (await xpower_nft.idBy(nft_year, UNIT)).toNumber();
      expect(nft_id).to.be.greaterThan(0);
      await xpower_nft.transferOwnership(addresses[1]);
      expect(
        await xpower_nft.setURI(NFT_LOKI_WWW).catch((ex) => {
          const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("setContractURI", function () {
    it("should set new contractURI", async function () {
      await xpower_nft.grantRole(xpower_nft.URI_DATA_ROLE(), addresses[0]);
      expect(await xpower_nft.contractURI()).to.eq("");
      await xpower_nft.setContractURI(NFT_LOKI_WWW);
      const nft_url = await xpower_nft.contractURI();
      expect(nft_url).to.eq(NFT_LOKI_WWW);
    });
    it("should *not* set new contractURI (account is missing role)", async function () {
      await xpower_nft.revokeRole(xpower_nft.URI_DATA_ROLE(), addresses[0]);
      expect(await xpower_nft.contractURI()).to.eq("");
      await xpower_nft.transferOwnership(addresses[1]);
      expect(
        await xpower_nft.setContractURI(NFT_LOKI_WWW).catch((ex) => {
          const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
});
