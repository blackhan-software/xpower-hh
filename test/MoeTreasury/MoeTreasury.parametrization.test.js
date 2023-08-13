const { ethers } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Sov, Nft, Ppt, Mty, Nty; // contracts
let moe, sov, nft, ppt, mty, nty; // instances

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years

describe("MoeTreasury", async function () {
  before(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
    addresses = accounts.map((acc) => acc.address);
    expect(addresses.length).to.be.greaterThan(1);
  });
  before(async function () {
    Moe = await ethers.getContractFactory("XPowerTest");
    expect(Moe).to.be.an("object");
    Sov = await ethers.getContractFactory("APower");
    expect(Sov).to.be.an("object");
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.be.an("object");
    Ppt = await ethers.getContractFactory("XPowerPpt");
    expect(Ppt).to.be.an("object");
    Nty = await ethers.getContractFactory("NftTreasury");
    expect(Nty).to.be.an("object");
    Mty = await ethers.getContractFactory("MoeTreasury");
    expect(Mty).to.be.an("object");
  });
  beforeEach(async function () {
    moe = await Moe.deploy([], DEADLINE);
    expect(moe).to.be.an("object");
    await moe.init();
    sov = await Sov.deploy(moe.target, [], DEADLINE);
    expect(sov).to.be.an("object");
  });
  beforeEach(async function () {
    nft = await Nft.deploy(moe.target, NFT_XPOW_URL, [], DEADLINE);
    expect(nft).to.be.an("object");
    ppt = await Ppt.deploy(NFT_XPOW_URL, [], DEADLINE);
    expect(ppt).to.be.an("object");
  });
  beforeEach(async function () {
    mty = await Mty.deploy(moe.target, sov.target, ppt.target);
    expect(mty).to.be.an("object");
    nty = await Nty.deploy(nft.target, ppt.target, mty.target);
    expect(nty).to.be.an("object");
  });
  beforeEach(async function () {
    await sov.transferOwnership(mty.target);
    expect(await sov.owner()).to.eq(mty.target);
  });
  describe("parametrization of APR", async function () {
    it("should get array", async function () {
      Expect(await mty.getAPR(202103)).to.eq([0, 3, 1e6, 256]);
    });
    it("should set array", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      await mty.setAPR(202103, [0, 3, 2e6, 256]);
      Expect(await mty.getAPR(202103)).to.eq([0, 3, 2e6, 256]);
    });
    it("should *not* set array (invalid array.length)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(202103, [1, 2, 3]).catch((ex) => {
          const m = ex.message.match(/invalid array.length/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
      Expect(await mty.getAPR(202103)).to.eq([0, 3, 1e6, 256]);
    });
    it("should *not* set array (invalid array[1] == 0)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(202103, [0, 0, 0, 0]).catch((ex) => {
          const m = ex.message.match(/invalid array\[1\] == 0/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
      Expect(await mty.getAPR(202103)).to.eq([0, 3, 1e6, 256]);
    });
    it("should *not* set array (invalid array[2] == 0)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(202103, [0, 1, 0, 0]).catch((ex) => {
          const m = ex.message.match(/invalid array\[2\] == 0/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
      Expect(await mty.getAPR(202103)).to.eq([0, 3, 1e6, 256]);
    });
    it("should *not* set array (missing role)", async function () {
      const [_owner, signer_1] = await ethers.getSigners();
      expect(
        await mty
          .connect(signer_1)
          .setAPR(202103, [0, 3, 2e6, 256])
          .catch((ex) => {
            const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
            if (m === null) console.debug(ex);
            expect(m).to.not.eq(null);
          }),
      ).to.eq(undefined);
      Expect(await mty.getAPR(202103)).to.eq([0, 3, 1e6, 256]);
    });
  });
  describe("parametrization of APR bonus", async function () {
    it("should get array", async function () {
      Expect(await mty.getAPB(202103)).to.eq([0, 1, 0.01e6, 256]);
    });
    it("should set array", async function () {
      await mty.grantRole(mty.APB_ROLE(), addresses[0]);
      await mty.setAPB(202103, [0, 1, 0.02e6, 256]);
      Expect(await mty.getAPB(202103)).to.eq([0, 1, 0.02e6, 256]);
    });
    it("should *not* set array (invalid array.length)", async function () {
      await mty.grantRole(mty.APB_ROLE(), addresses[0]);
      expect(
        await mty.setAPB(202103, [1, 2, 3]).catch((ex) => {
          const m = ex.message.match(/invalid array.length/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
      Expect(await mty.getAPB(202103)).to.eq([0, 1, 0.01e6, 256]);
    });
    it("should *not* set array (invalid array[1] == 0)", async function () {
      await mty.grantRole(mty.APB_ROLE(), addresses[0]);
      expect(
        await mty.setAPB(202103, [0, 0, 0, 0]).catch((ex) => {
          const m = ex.message.match(/invalid array\[1\] == 0/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
      Expect(await mty.getAPB(202103)).to.eq([0, 1, 0.01e6, 256]);
    });
    it("should *not* set array (invalid array[2] == 0)", async function () {
      await mty.grantRole(mty.APB_ROLE(), addresses[0]);
      expect(
        await mty.setAPB(202103, [0, 1, 0, 0]).catch((ex) => {
          const m = ex.message.match(/invalid array\[2\] == 0/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
      Expect(await mty.getAPB(202103)).to.eq([0, 1, 0.01e6, 256]);
    });
    it("should *not* set array (missing role)", async function () {
      const [_owner, signer_1] = await ethers.getSigners();
      expect(
        await mty
          .connect(signer_1)
          .setAPB(202103, [0, 1, 0.02e6, 256])
          .catch((ex) => {
            const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
            if (m === null) console.debug(ex);
            expect(m).to.not.eq(null);
          }),
      ).to.eq(undefined);
      Expect(await mty.getAPB(202103)).to.eq([0, 1, 0.01e6, 256]);
    });
  });
});
function Expect(array) {
  return expect(array.map((n) => Number(n))).deep;
}
