/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contracts
let xpower; // instances
let Nft; // contracts
let nft; // instances

const NFT_ODIN_URL = "https://xpowermine.com/nfts/odin/{id}.json";
const NONE_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years

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
    XPower = await ethers.getContractFactory("XPowerOdinTest");
    expect(XPower).to.exist;
  });
  before(async function () {
    Nft = await ethers.getContractFactory("XPowerOdinNft");
    expect(Nft).to.exist;
  });
  before(async function () {
    xpower = await XPower.deploy(NONE_ADDRESS, DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
  });
  before(async function () {
    nft = await Nft.deploy(
      NONE_ADDRESS,
      xpower.address,
      NFT_ODIN_URL,
      DEADLINE
    );
    expect(nft).to.exist;
    await nft.deployed();
  });
  describe("supportsInterface", function () {
    it("should support IERC165 interface", async function () {
      expect(await nft.supportsInterface(0x01ffc9a7)).to.eq(true);
    });
    it("should support IERC1155 interface", async function () {
      expect(await nft.supportsInterface(0xd9b67a26)).to.eq(true);
    });
    it("should support IERC1155MetadataURI interface", async function () {
      expect(await nft.supportsInterface(0x0e89341c)).to.eq(true);
    });
    it("should support IAccessControl interface", async function () {
      expect(await nft.supportsInterface(0x7965db0b)).to.eq(true);
    });
    it("should support IAccessControlEnumerable interface", async function () {
      expect(await nft.supportsInterface(0x5a05180f)).to.eq(true);
    });
  });
});
