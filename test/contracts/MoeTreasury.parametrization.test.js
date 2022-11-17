/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let APower, XPower, Nft, NftStaked, NftTreasury, MoeTreasury; // contracts
let apower, xpower, nft, nft_staked, nft_treasury, moe_treasury, mt; // instances

const NFT_ODIN_URL = "https://xpowermine.com/nfts/odin/{id}.json";
const NONE_ADDRESS = "0x0000000000000000000000000000000000000000";
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
    APower = await ethers.getContractFactory("APowerOdin");
    expect(APower).to.exist;
    XPower = await ethers.getContractFactory("XPowerOdinTest");
    expect(XPower).to.exist;
  });
  before(async function () {
    Nft = await ethers.getContractFactory("XPowerOdinNft");
    expect(Nft).to.exist;
    NftStaked = await ethers.getContractFactory("XPowerOdinNftStaked");
    expect(NftStaked).to.exist;
    NftTreasury = await ethers.getContractFactory("NftTreasury");
    expect(NftTreasury).to.exist;
    MoeTreasury = await ethers.getContractFactory("MoeTreasury");
    expect(MoeTreasury).to.exist;
  });
  beforeEach(async function () {
    xpower = await XPower.deploy(NONE_ADDRESS, DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
    await xpower.init();
  });
  beforeEach(async function () {
    apower = await APower.deploy(xpower.address, NONE_ADDRESS, DEADLINE);
    expect(apower).to.exist;
    await apower.deployed();
  });
  beforeEach(async function () {
    nft = await Nft.deploy(
      NFT_ODIN_URL,
      xpower.address,
      NONE_ADDRESS,
      DEADLINE
    );
    expect(nft).to.exist;
    await nft.deployed();
  });
  beforeEach(async function () {
    nft_staked = await NftStaked.deploy(NFT_ODIN_URL, NONE_ADDRESS, DEADLINE);
    expect(nft_staked).to.exist;
    await nft_staked.deployed();
  });
  beforeEach(async function () {
    nft_treasury = await NftTreasury.deploy(nft.address, nft_staked.address);
    expect(nft_treasury).to.exist;
    await nft_treasury.deployed();
  });
  beforeEach(async function () {
    moe_treasury = await MoeTreasury.deploy(
      apower.address,
      xpower.address,
      nft_staked.address
    );
    expect(moe_treasury).to.exist;
    await moe_treasury.deployed();
    mt = moe_treasury;
  });
  beforeEach(async function () {
    await apower.transferOwnership(moe_treasury.address);
    expect(await apower.owner()).to.eq(moe_treasury.address);
  });
  describe("parametrization of APR", async function () {
    it("should get alpha array", async function () {
      Expect(await moe_treasury.getAPR()).to.equal([0, 0, 3, 1000, 0, 0]);
    });
    it("should set alpha array", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      await moe_treasury.setAPR([1, 2, 3, 4, 5, 6]);
      Expect(await moe_treasury.getAPR()).to.equal([1, 2, 3, 4, 5, 6]);
    });
    it("should *not* set alpha array (invalid array.length)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPR([1, 2, 3]).catch((ex) => {
          const m = ex.message.match(/invalid array.length/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await moe_treasury.getAPR()).to.equal([0, 0, 3, 1000, 0, 0]);
    });
    it("should *not* set alpha array (account is missing role)", async function () {
      const [owner, signer_1] = await ethers.getSigners();
      expect(
        await moe_treasury
          .connect(signer_1)
          .setAPR([1, 2, 3, 4, 5, 6])
          .catch((ex) => {
            const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
      Expect(await moe_treasury.getAPR()).to.equal([0, 0, 3, 1000, 0, 0]);
    });
  });
  describe("parametrization of APR bonus", async function () {
    it("should get gamma array", async function () {
      Expect(await moe_treasury.getAPRBonus()).to.equal([0, 0, 1, 10, 0, 0]);
    });
    it("should set gamma array", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_BONUS_ROLE(), addresses[0]);
      await moe_treasury.setAPRBonus([1, 2, 3, 4, 5, 6]);
      Expect(await moe_treasury.getAPRBonus()).to.equal([1, 2, 3, 4, 5, 6]);
    });
    it("should *not* set gamma array (invalid array.length)", async function () {
      await moe_treasury.grantRole(moe_treasury.APR_BONUS_ROLE(), addresses[0]);
      expect(
        await moe_treasury.setAPRBonus([1, 2, 3]).catch((ex) => {
          const m = ex.message.match(/invalid array.length/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await moe_treasury.getAPRBonus()).to.equal([0, 0, 1, 10, 0, 0]);
    });
    it("should *not* set gamma array (account is missing role)", async function () {
      const [owner, signer_1] = await ethers.getSigners();
      expect(
        await moe_treasury
          .connect(signer_1)
          .setAPRBonus([1, 2, 3, 4, 5, 6])
          .catch((ex) => {
            const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
            if (m === null) console.debug(ex);
            expect(m).to.be.not.null;
          })
      ).to.eq(undefined);
      Expect(await moe_treasury.getAPRBonus()).to.equal([0, 0, 1, 10, 0, 0]);
    });
  });
});
function Expect(array) {
  return expect(array.map((bn) => bn.toNumber())).deep;
}
