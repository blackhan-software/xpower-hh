/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contracts
let xpower; // instances
let Nft, Ppt; // contracts
let nft, ppt; // instances

const NFT_ODIN_URL = "https://xpowermine.com/nfts/odin/{id}.json";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years

describe("XPowerPpt", async function () {
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
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.exist;
    Ppt = await ethers.getContractFactory("XPowerPpt");
    expect(Ppt).to.exist;
  });
  before(async function () {
    xpower = await XPower.deploy([], DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
  });
  before(async function () {
    nft = await Nft.deploy(NFT_ODIN_URL, [xpower.address], [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
    ppt = await Ppt.deploy(NFT_ODIN_URL, [], DEADLINE);
    expect(ppt).to.exist;
    await ppt.deployed();
  });
  describe("supportsInterface", function () {
    it("should support IERC165 interface", async function () {
      expect(await ppt.supportsInterface(0x01ffc9a7)).to.eq(true);
    });
    it("should support IERC1155 interface", async function () {
      expect(await ppt.supportsInterface(0xd9b67a26)).to.eq(true);
    });
    it("should support IERC1155MetadataURI interface", async function () {
      expect(await ppt.supportsInterface(0x0e89341c)).to.eq(true);
    });
    it("should support IAccessControl interface", async function () {
      expect(await ppt.supportsInterface(0x7965db0b)).to.eq(true);
    });
    it("should support IAccessControlEnumerable interface", async function () {
      expect(await ppt.supportsInterface(0x5a05180f)).to.eq(true);
    });
  });
});
