/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Nft; // contracts
let moe, nft; // instances
let UNIT; // decimals

const NFT_XPOW_WWW = "https://www.xpowermine.com/nfts/xpow/{id}.json";
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
    Moe = await ethers.getContractFactory("XPowerTest");
    expect(Moe).to.exist;
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.exist;
  });
  beforeEach(async function () {
    moe = await Moe.deploy([], DEADLINE);
    expect(moe).to.exist;
    await moe.deployed();
    await moe.transferOwnership(addresses[1]);
    await moe.init();
  });
  beforeEach(async function () {
    const decimals = await moe.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.be.true;
  });
  beforeEach(async function () {
    nft = await Nft.deploy(moe.address, NFT_XPOW_URL, [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
  });
  after(async function () {
    const [owner, signer_1] = await ethers.getSigners();
    await moe.connect(signer_1).transferOwnership(owner.address);
  });
  describe("setURI", function () {
    it("should set new URI", async function () {
      await nft.grantRole(nft.URI_DATA_ROLE(), addresses[0]);
      const nft_year = (await nft.year()).toNumber();
      expect(nft_year).to.be.greaterThan(0);
      const nft_id = (await nft.idBy(nft_year, 0)).toNumber();
      expect(nft_id).to.be.greaterThan(0);
      await nft.setURI(NFT_XPOW_WWW);
      const nft_url = await nft.uri(nft_id);
      expect(nft_url).to.eq(NFT_XPOW_WWW);
    });
    it("should *not* set new URI (missing role)", async function () {
      await nft.revokeRole(nft.URI_DATA_ROLE(), addresses[0]);
      const nft_year = (await nft.year()).toNumber();
      expect(nft_year).to.be.greaterThan(0);
      const nft_id = (await nft.idBy(nft_year, 0)).toNumber();
      expect(nft_id).to.be.greaterThan(0);
      await nft.transferOwnership(addresses[1]);
      expect(
        await nft.setURI(NFT_XPOW_WWW).catch((ex) => {
          const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("setContractURI", function () {
    it("should set new contractURI", async function () {
      await nft.grantRole(nft.URI_DATA_ROLE(), addresses[0]);
      expect(await nft.contractURI()).to.eq("");
      await nft.setContractURI(NFT_XPOW_WWW);
      const nft_url = await nft.contractURI();
      expect(nft_url).to.eq(NFT_XPOW_WWW);
    });
    it("should *not* set new contractURI (missing role)", async function () {
      await nft.revokeRole(nft.URI_DATA_ROLE(), addresses[0]);
      expect(await nft.contractURI()).to.eq("");
      await nft.transferOwnership(addresses[1]);
      expect(
        await nft.setContractURI(NFT_XPOW_WWW).catch((ex) => {
          const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
});
