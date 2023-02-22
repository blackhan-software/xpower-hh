/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let Nft, Ppt, NftTreasury, MoeTreasury; // contracts
let nft, ppt, nft_treasury, moe_treasury, mt; // instances
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
    NftTreasury = await ethers.getContractFactory("NftTreasury");
    expect(NftTreasury).to.exist;
    MoeTreasury = await ethers.getContractFactory("MoeTreasury");
    expect(MoeTreasury).to.exist;
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
  });
  beforeEach(async function () {
    ppt = await Ppt.deploy(NFT_ODIN_URL, [], DEADLINE);
    expect(ppt).to.exist;
    await ppt.deployed();
  });
  beforeEach(async function () {
    nft_treasury = await NftTreasury.deploy(nft.address, ppt.address);
    expect(nft_treasury).to.exist;
    await nft_treasury.deployed();
  });
  beforeEach(async function () {
    moe_treasury = await MoeTreasury.deploy(
      [xthor.address, xloki.address, xodin.address],
      [athor.address, aloki.address, aodin.address],
      ppt.address
    );
    expect(moe_treasury).to.exist;
    await moe_treasury.deployed();
    mt = moe_treasury;
  });
  beforeEach(async function () {
    await athor.transferOwnership(moe_treasury.address);
    expect(await athor.owner()).to.eq(moe_treasury.address);
    await aloki.transferOwnership(moe_treasury.address);
    expect(await aloki.owner()).to.eq(moe_treasury.address);
    await aodin.transferOwnership(moe_treasury.address);
    expect(await aodin.owner()).to.eq(moe_treasury.address);
  });
  describe("parametrization of APR", async function () {
    it("should get array", async function () {
      Expect(await moe_treasury.getAPR(3)).to.equal([0, 0, 3, 1000]);
    });
    it("should set array", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      await moe_treasury.setAPR(3, [0, 0, 3, 2000]);
      Expect(await moe_treasury.getAPR(3)).to.equal([0, 0, 3, 2000]);
    });
    it("should *not* set array (invalid array.length)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR(3, [1, 2, 3]).catch((ex) => {
          const m = ex.message.match(/invalid array.length/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await moe_treasury.getAPR(3)).to.equal([0, 0, 3, 1000]);
    });
    it("should *not* set array (invalid array[2] == 0)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR(3, [0, 0, 0, 0]).catch((ex) => {
          const m = ex.message.match(/invalid array\[2\] == 0/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await moe_treasury.getAPR(3)).to.equal([0, 0, 3, 1000]);
    });
    it("should *not* set array (invalid array[3] == 0)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR(3, [0, 0, 1, 0]).catch((ex) => {
          const m = ex.message.match(/invalid array\[3\] == 0/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await moe_treasury.getAPR(3)).to.equal([0, 0, 3, 1000]);
    });
    it("should *not* set array (account is missing role)", async function () {
      const [owner, signer_1] = await ethers.getSigners();
      expect(
        await moe_treasury
          .connect(signer_1)
          .setAPR(3, [0, 0, 3, 2000])
          .catch((ex) => {
            const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
      Expect(await moe_treasury.getAPR(3)).to.equal([0, 0, 3, 1000]);
    });
  });
  describe("parametrization of APR bonus", async function () {
    it("should get array", async function () {
      Expect(await moe_treasury.getAPRBonus(3)).to.equal([0, 0, 1, 10]);
    });
    it("should set array", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_BONUS_ROLE(), addresses[0]);
      await moe_treasury.setAPRBonus(3, [0, 0, 1, 20]);
      Expect(await moe_treasury.getAPRBonus(3)).to.equal([0, 0, 1, 20]);
    });
    it("should *not* set array (invalid array.length)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPRBonus(3, [1, 2, 3]).catch((ex) => {
          const m = ex.message.match(/invalid array.length/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await moe_treasury.getAPRBonus(3)).to.equal([0, 0, 1, 10]);
    });
    it("should *not* set array (invalid array[2] == 0)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPRBonus(3, [0, 0, 0, 0]).catch((ex) => {
          const m = ex.message.match(/invalid array\[2\] == 0/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await moe_treasury.getAPRBonus(3)).to.equal([0, 0, 1, 10]);
    });
    it("should *not* set array (invalid array[3] == 0)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPRBonus(3, [0, 0, 1, 0]).catch((ex) => {
          const m = ex.message.match(/invalid array\[3\] == 0/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await moe_treasury.getAPRBonus(3)).to.equal([0, 0, 1, 10]);
    });
    it("should *not* set array (account is missing role)", async function () {
      const [owner, signer_1] = await ethers.getSigners();
      expect(
        await moe_treasury
          .connect(signer_1)
          .setAPRBonus(3, [0, 0, 1, 20])
          .catch((ex) => {
            const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
      Expect(await moe_treasury.getAPRBonus(3)).to.equal([0, 0, 1, 10]);
    });
  });
});
function Expect(array) {
  return expect(array.map((bn) => bn.toNumber())).deep;
}
