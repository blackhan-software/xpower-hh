/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Sov, Nft, Ppt, Mty, Nty; // contracts
let moe, sov, nft, ppt, mty, nty; // instances

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years

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
    Moe = await ethers.getContractFactory("XPowerTest");
    expect(Moe).to.exist;
    Sov = await ethers.getContractFactory("APower");
    expect(Sov).to.exist;
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.exist;
    Ppt = await ethers.getContractFactory("XPowerPpt");
    expect(Ppt).to.exist;
    Nty = await ethers.getContractFactory("NftTreasury");
    expect(Nty).to.exist;
    Mty = await ethers.getContractFactory("MoeTreasury");
    expect(Mty).to.exist;
  });
  beforeEach(async function () {
    moe = await Moe.deploy([], DEADLINE);
    expect(moe).to.exist;
    await moe.deployed();
    await moe.init();
    sov = await Sov.deploy(moe.address, [], DEADLINE);
    expect(sov).to.exist;
    await sov.deployed();
  });
  beforeEach(async function () {
    nft = await Nft.deploy(moe.address, NFT_XPOW_URL, [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
    ppt = await Ppt.deploy(NFT_XPOW_URL, [], DEADLINE);
    expect(ppt).to.exist;
    await ppt.deployed();
  });
  beforeEach(async function () {
    mty = await Mty.deploy(moe.address, sov.address, ppt.address);
    expect(mty).to.exist;
    await mty.deployed();
    nty = await Nty.deploy(nft.address, ppt.address, mty.address);
    expect(nty).to.exist;
    await nty.deployed();
  });
  beforeEach(async function () {
    await sov.transferOwnership(mty.address);
    expect(await sov.owner()).to.eq(mty.address);
  });
  describe("parametrization of APR", async function () {
    it("should get array", async function () {
      Expect(await mty.getAPR(202103)).to.equal([0, 3, 1_000_000]);
    });
    it("should set array", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      await mty.setAPR(202103, [0, 3, 2_000_000]);
      Expect(await mty.getAPR(202103)).to.equal([0, 3, 2_000_000]);
    });
    it("should *not* set array (invalid array.length)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(202103, [1, 2]).catch((ex) => {
          const m = ex.message.match(/invalid array.length/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await mty.getAPR(202103)).to.equal([0, 3, 1_000_000]);
    });
    it("should *not* set array (invalid array[1] == 0)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(202103, [0, 0, 0]).catch((ex) => {
          const m = ex.message.match(/invalid array\[1\] == 0/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await mty.getAPR(202103)).to.equal([0, 3, 1_000_000]);
    });
    it("should *not* set array (invalid array[2] == 0)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(202103, [0, 1, 0]).catch((ex) => {
          const m = ex.message.match(/invalid array\[2\] == 0/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await mty.getAPR(202103)).to.equal([0, 3, 1_000_000]);
    });
    it("should *not* set array (missing role)", async function () {
      const [owner, signer_1] = await ethers.getSigners();
      expect(
        await mty
          .connect(signer_1)
          .setAPR(202103, [0, 3, 2_000_000])
          .catch((ex) => {
            const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
      Expect(await mty.getAPR(202103)).to.equal([0, 3, 1_000_000]);
    });
  });
  describe("parametrization of APR bonus", async function () {
    it("should get array", async function () {
      Expect(await mty.getAPRBonus(202103)).to.equal([0, 1, 10_000]);
    });
    it("should set array", async function () {
      await mty.grantRole(mty.APR_BONUS_ROLE(), addresses[0]);
      await mty.setAPRBonus(202103, [0, 1, 20_000]);
      Expect(await mty.getAPRBonus(202103)).to.equal([0, 1, 20_000]);
    });
    it("should *not* set array (invalid array.length)", async function () {
      await mty.grantRole(mty.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await mty.setAPRBonus(202103, [1, 2]).catch((ex) => {
          const m = ex.message.match(/invalid array.length/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await mty.getAPRBonus(202103)).to.equal([0, 1, 10_000]);
    });
    it("should *not* set array (invalid array[1] == 0)", async function () {
      await mty.grantRole(mty.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await mty.setAPRBonus(202103, [0, 0, 0]).catch((ex) => {
          const m = ex.message.match(/invalid array\[1\] == 0/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await mty.getAPRBonus(202103)).to.equal([0, 1, 10_000]);
    });
    it("should *not* set array (invalid array[2] == 0)", async function () {
      await mty.grantRole(mty.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await mty.setAPRBonus(202103, [0, 1, 0]).catch((ex) => {
          const m = ex.message.match(/invalid array\[2\] == 0/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await mty.getAPRBonus(202103)).to.equal([0, 1, 10_000]);
    });
    it("should *not* set array (missing role)", async function () {
      const [owner, signer_1] = await ethers.getSigners();
      expect(
        await mty
          .connect(signer_1)
          .setAPRBonus(202103, [0, 1, 20_000])
          .catch((ex) => {
            const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
      Expect(await mty.getAPRBonus(202103)).to.equal([0, 1, 10_000]);
    });
  });
});
function Expect(array) {
  return expect(array.map((bn) => bn.toNumber())).deep;
}
