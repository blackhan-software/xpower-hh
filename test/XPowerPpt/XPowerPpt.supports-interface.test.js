const { ethers } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Nft, Ppt; // contract
let moe, nft, ppt; // instance

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";

describe("XPowerPpt", async function () {
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
    Ppt = await ethers.getContractFactory("XPowerPpt");
    expect(Ppt).to.be.an("object");
  });
  before(async function () {
    moe = await Moe.deploy([], 0);
    expect(moe).to.be.an("object");
    nft = await Nft.deploy(moe.target, NFT_XPOW_URL, [], 0);
    expect(nft).to.be.an("object");
    ppt = await Ppt.deploy(NFT_XPOW_URL, [], 0);
    expect(ppt).to.be.an("object");
  });
  describe("supportsInterface", function () {
    it("should support IERC165 interface", async function () {
      expect(await ppt.supportsInterface("0x01ffc9a7")).to.eq(true);
    });
    it("should support IERC2981 interface", async function () {
      expect(await nft.supportsInterface("0x2a55205a")).to.eq(true);
    });
    it("should support IERC1155 interface", async function () {
      expect(await ppt.supportsInterface("0xd9b67a26")).to.eq(true);
    });
    it("should support IERC1155MetadataURI interface", async function () {
      expect(await ppt.supportsInterface("0x0e89341c")).to.eq(true);
    });
    it("should support IAccessControl interface", async function () {
      expect(await ppt.supportsInterface("0x7965db0b")).to.eq(true);
    });
    it("should support IAccessControlEnumerable interface", async function () {
      expect(await ppt.supportsInterface("0x5a05180f")).to.eq(true);
    });
  });
});
