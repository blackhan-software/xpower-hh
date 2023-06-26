/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let Nft, Ppt, Mty, Nty; // contracts
let nft, ppt, mty, nty; // instances
let AThor, XThor, ALoki, XLoki, AOdin, XOdin; // contracts
let athor, xthor, aloki, xloki, aodin, xodin; // instances

const NFT_ODIN_URL = "https://xpowermine.com/nfts/odin/{id}.json";
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
    AThor = await ethers.getContractFactory("APowerThor");
    expect(AThor).to.exist;
    XThor = await ethers.getContractFactory("XPowerThorTest");
    expect(XThor).to.exist;
    ALoki = await ethers.getContractFactory("APowerLoki");
    expect(ALoki).to.exist;
    XLoki = await ethers.getContractFactory("XPowerLokiTest");
    expect(XLoki).to.exist;
    AOdin = await ethers.getContractFactory("APowerOdin");
    expect(AOdin).to.exist;
    XOdin = await ethers.getContractFactory("XPowerOdinTest");
    expect(XOdin).to.exist;
  });
  before(async function () {
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
    xthor = await XThor.deploy([], DEADLINE);
    expect(xthor).to.exist;
    await xthor.deployed();
    await xthor.init();
    xloki = await XLoki.deploy([], DEADLINE);
    expect(xloki).to.exist;
    await xloki.deployed();
    await xloki.init();
    xodin = await XOdin.deploy([], DEADLINE);
    expect(xodin).to.exist;
    await xodin.deployed();
    await xodin.init();
  });
  beforeEach(async function () {
    athor = await AThor.deploy(xthor.address, [], DEADLINE);
    expect(athor).to.exist;
    await athor.deployed();
    aloki = await ALoki.deploy(xloki.address, [], DEADLINE);
    expect(aloki).to.exist;
    await aloki.deployed();
    aodin = await AOdin.deploy(xodin.address, [], DEADLINE);
    expect(aodin).to.exist;
    await aodin.deployed();
  });
  beforeEach(async function () {
    nft = await Nft.deploy(NFT_ODIN_URL, [xodin.address], [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
    ppt = await Ppt.deploy(NFT_ODIN_URL, [], DEADLINE);
    expect(ppt).to.exist;
    await ppt.deployed();
  });
  beforeEach(async function () {
    mty = await Mty.deploy(
      [xthor.address, xloki.address, xodin.address],
      [athor.address, aloki.address, aodin.address],
      ppt.address
    );
    expect(mty).to.exist;
    await mty.deployed();
    nty = await Nty.deploy(nft.address, ppt.address, mty.address);
    expect(nty).to.exist;
    await nty.deployed();
  });
  beforeEach(async function () {
    await athor.transferOwnership(mty.address);
    expect(await athor.owner()).to.eq(mty.address);
    await aloki.transferOwnership(mty.address);
    expect(await aloki.owner()).to.eq(mty.address);
    await aodin.transferOwnership(mty.address);
    expect(await aodin.owner()).to.eq(mty.address);
  });
  describe("parametrization of APR", async function () {
    it("should get array", async function () {
      Expect(await mty.getAPR(3202103)).to.equal([0, 3, 1000000]);
    });
    it("should set array", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      await mty.setAPR(3202103, [0, 3, 2000000]);
      Expect(await mty.getAPR(3202103)).to.equal([0, 3, 2000000]);
    });
    it("should *not* set array (invalid array.length)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(3202103, [1, 2]).catch((ex) => {
          const m = ex.message.match(/invalid array.length/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await mty.getAPR(3202103)).to.equal([0, 3, 1000000]);
    });
    it("should *not* set array (invalid array[1] == 0)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(3202103, [0, 0, 0]).catch((ex) => {
          const m = ex.message.match(/invalid array\[1\] == 0/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await mty.getAPR(3202103)).to.equal([0, 3, 1000000]);
    });
    it("should *not* set array (invalid array[2] == 0)", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      expect(
        await mty.setAPR(3202103, [0, 1, 0]).catch((ex) => {
          const m = ex.message.match(/invalid array\[2\] == 0/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await mty.getAPR(3202103)).to.equal([0, 3, 1000000]);
    });
    it("should *not* set array (missing role)", async function () {
      const [owner, signer_1] = await ethers.getSigners();
      expect(
        await mty
          .connect(signer_1)
          .setAPR(3202103, [0, 3, 2000000])
          .catch((ex) => {
            const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
      Expect(await mty.getAPR(3202103)).to.equal([0, 3, 1000000]);
    });
  });
  describe("parametrization of APR bonus", async function () {
    it("should get array", async function () {
      Expect(await mty.getAPRBonus(3202103)).to.equal([0, 1, 10000]);
    });
    it("should set array", async function () {
      await mty.grantRole(mty.APR_BONUS_ROLE(), addresses[0]);
      await mty.setAPRBonus(3202103, [0, 1, 20000]);
      Expect(await mty.getAPRBonus(3202103)).to.equal([0, 1, 20000]);
    });
    it("should *not* set array (invalid array.length)", async function () {
      await mty.grantRole(mty.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await mty.setAPRBonus(3202103, [1, 2]).catch((ex) => {
          const m = ex.message.match(/invalid array.length/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await mty.getAPRBonus(3202103)).to.equal([0, 1, 10000]);
    });
    it("should *not* set array (invalid array[1] == 0)", async function () {
      await mty.grantRole(mty.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await mty.setAPRBonus(3202103, [0, 0, 0]).catch((ex) => {
          const m = ex.message.match(/invalid array\[1\] == 0/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await mty.getAPRBonus(3202103)).to.equal([0, 1, 10000]);
    });
    it("should *not* set array (invalid array[2] == 0)", async function () {
      await mty.grantRole(mty.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await mty.setAPRBonus(3202103, [0, 1, 0]).catch((ex) => {
          const m = ex.message.match(/invalid array\[2\] == 0/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await mty.getAPRBonus(3202103)).to.equal([0, 1, 10000]);
    });
    it("should *not* set array (missing role)", async function () {
      const [owner, signer_1] = await ethers.getSigners();
      expect(
        await mty
          .connect(signer_1)
          .setAPRBonus(3202103, [0, 1, 20000])
          .catch((ex) => {
            const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
      Expect(await mty.getAPRBonus(3202103)).to.equal([0, 1, 10000]);
    });
  });
});
function Expect(array) {
  return expect(array.map((bn) => bn.toNumber())).deep;
}
