const { ethers, network } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Nft; // contract
let moe, nft; // instance
let UNIT; // decimals

const NFT_XPOW_WWW = "https://www.xpowermine.com/nfts/xpow/{id}.json";
const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
const YEAR = 365.25 * 86_400; // [seconds]

describe("XPowerNft", async function () {
  before(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
    addresses = accounts.map((acc) => acc.address);
    expect(addresses.length).to.be.greaterThan(1);
  });
  before(async function () {
    Moe = await ethers.getContractFactory("XPowerTest");
    expect(Moe).to.be.an("object");
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.be.an("object");
  });
  beforeEach(async function () {
    moe = await Moe.deploy([], 0);
    expect(moe).to.be.an("object");
    await moe.transferOwnership(addresses[1]);
    await moe.init();
  });
  beforeEach(async function () {
    const decimals = await moe.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.eq(true);
  });
  beforeEach(async function () {
    nft = await Nft.deploy(moe.target, NFT_XPOW_URL, [], 0);
    expect(nft).to.be.an("object");
  });
  after(async function () {
    const [owner, signer_1] = await ethers.getSigners();
    await moe.connect(signer_1).transferOwnership(owner.address);
  });
  describe("setURI(new-uri)", function () {
    it("should set new URI", async function () {
      await nft.grantRole(nft.URI_DATA_ROLE(), addresses[0]);
      const nft_year = await nft.year();
      expect(nft_year).to.be.greaterThan(0);
      const nft_id = await nft.idBy(nft_year, 0);
      expect(nft_id).to.be.greaterThan(0);
      await nft.setURI(NFT_XPOW_WWW);
      const nft_url = await nft.uri(nft_id);
      expect(nft_url).to.eq(NFT_XPOW_WWW);
    });
    it("should *not* set new URI (missing role)", async function () {
      await nft.revokeRole(nft.URI_DATA_ROLE(), addresses[0]);
      const nft_year = await nft.year();
      expect(nft_year).to.be.greaterThan(0);
      const nft_id = await nft.idBy(nft_year, 0);
      expect(nft_id).to.be.greaterThan(0);
      await nft.transferOwnership(addresses[1]);
      expect(
        await nft.setURI(NFT_XPOW_WWW).catch((ex) => {
          const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
  });
  describe("setURI(new-uri,year)", function () {
    it("should set new URI", async function () {
      await nft.grantRole(nft.URI_DATA_ROLE(), addresses[0]);
      const nft_year = 2021; // fixed year
      expect(nft_year).to.be.greaterThan(0);
      const nft_id = await nft.idBy(nft_year, 0);
      expect(nft_id).to.be.greaterThan(0);
      await nft["setURI(string, uint256)"](NFT_XPOW_WWW, nft_year);
      const nft_url = await nft.uri(nft_id);
      expect(nft_url).to.eq(NFT_XPOW_WWW);
      const url_fixed = await nft.fixedURI(nft_id);
      expect(url_fixed).to.eq(false);
    });
    it("should *not* set new URI (immalleable year)", async function () {
      await network.provider.send("evm_setNextBlockTimestamp", [
        61 * YEAR, // 2031 = (1970 + 51) + 10
      ]);
      await nft.grantRole(nft.URI_DATA_ROLE(), addresses[0]);
      const nft_year = 2021; // fixed year
      expect(nft_year).to.be.greaterThan(0);
      const nft_id = await nft.idBy(nft_year, 0);
      expect(nft_id).to.be.greaterThan(0);
      const url_fixed0 = await nft.fixedURI(nft_id);
      expect(url_fixed0).to.eq(false);
      await nft["setURI(string, uint256)"](NFT_XPOW_WWW, nft_year); // since empty!
      const nft_url1 = await nft.uri(nft_id);
      expect(nft_url1).to.eq(NFT_XPOW_WWW);
      const url_fixed1 = await nft.fixedURI(nft_id);
      expect(url_fixed1).to.eq(true);
      expect(
        await nft["setURI(string,uint256)"](NFT_XPOW_URL, nft_year).catch(
          (ex) => {
            const m = ex.message.match(/immalleable year/);
            if (m === null) console.debug(ex);
            expect(m).to.not.eq(null);
          },
        ),
      ).to.eq(undefined);
      const nft_url2 = await nft.uri(nft_id);
      expect(nft_url2).to.eq(NFT_XPOW_WWW);
      const url_fixed2 = await nft.fixedURI(nft_id);
      expect(url_fixed2).to.eq(true);
    });
    it("should *not* set new URI (invalid year)", async function () {
      await nft.grantRole(nft.URI_DATA_ROLE(), addresses[0]);
      const nft_year = 2020; // fixed year
      expect(nft_year).to.be.greaterThan(0);
      expect(
        await nft["setURI(string,uint256)"](NFT_XPOW_WWW, nft_year).catch(
          (ex) => {
            const m = ex.message.match(/invalid year/);
            if (m === null) console.debug(ex);
            expect(m).to.not.eq(null);
          },
        ),
      ).to.eq(undefined);
    });
    it("should *not* set new URI (missing role)", async function () {
      await nft.revokeRole(nft.URI_DATA_ROLE(), addresses[0]);
      const nft_year = 2021; // fixed year
      expect(nft_year).to.be.greaterThan(0);
      const nft_id = await nft.idBy(nft_year, 0);
      expect(nft_id).to.be.greaterThan(0);
      await nft.transferOwnership(addresses[1]);
      expect(
        await nft["setURI(string,uint256)"](NFT_XPOW_WWW, nft_year).catch(
          (ex) => {
            const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
            if (m === null) console.debug(ex);
            expect(m).to.not.eq(null);
          },
        ),
      ).to.eq(undefined);
      const url_fixed = await nft.fixedURI(nft_id);
      expect(url_fixed).to.eq(false);
    });
  });
  describe("setContractURI(new-uri)", function () {
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
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
  });
});
