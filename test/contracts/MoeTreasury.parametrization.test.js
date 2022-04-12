/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower, Nft, NftStaked, NftTreasury, MoeTreasury; // contracts
let xpower, nft, nft_staked, nft_treasury, moe_treasury, mt; // instances

const NFT_QRSH_URL = "https://xpowermine.com/nfts/qrsh/{id}.json";
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
    XPower = await ethers.getContractFactory("XPowerQrshTest");
    expect(XPower).to.exist;
  });
  before(async function () {
    Nft = await ethers.getContractFactory("XPowerQrshNft");
    expect(Nft).to.exist;
    NftStaked = await ethers.getContractFactory("XPowerQrshNftStaked");
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
    nft = await Nft.deploy(
      NFT_QRSH_URL,
      NONE_ADDRESS,
      DEADLINE,
      xpower.address
    );
    expect(nft).to.exist;
    await nft.deployed();
    nft_staked = await NftStaked.deploy(NFT_QRSH_URL, NONE_ADDRESS, DEADLINE);
    expect(nft_staked).to.exist;
    await nft_staked.deployed();
    nft_treasury = await NftTreasury.deploy(nft.address, nft_staked.address);
    expect(nft_treasury).to.exist;
    await nft_treasury.deployed();
    moe_treasury = await MoeTreasury.deploy(xpower.address, nft_staked.address);
    expect(moe_treasury).to.exist;
    await moe_treasury.deployed();
    mt = moe_treasury;
  });
  describe("parametrization of APR", async function () {
    it("should get alpha array", async function () {
      Expect(await moe_treasury.getAlpha()).to.equal([0, 1, 1, 0]);
    });
    it("should set alpha array", async function () {
      await moe_treasury.setAlpha([1, 2, 3, 0]);
      Expect(await moe_treasury.getAlpha()).to.equal([1, 2, 3, 0]);
    });
    it("should *not* set alpha array (invalid array.length)", async function () {
      expect(
        await moe_treasury.setAlpha([1, 2, 3]).catch((ex) => {
          const m = ex.message.match(/invalid array.length/);
          if (m === null) console.debug(ex);
          expect().to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await moe_treasury.getAlpha()).to.equal([0, 1, 1, 0]);
    });
    it("should *not* set alpha array (not owner)", async function () {
      const [owner, signer_1] = await ethers.getSigners();
      expect(
        await moe_treasury
          .connect(signer_1)
          .setAlpha([1, 2, 3, 0])
          .catch((ex) => {
            const m = ex.message.match(/caller is not the owner/);
            if (m === null) console.debug(ex);
            expect().to.be.not.null;
          })
      ).to.eq(undefined);
      Expect(await moe_treasury.getAlpha()).to.equal([0, 1, 1, 0]);
    });
  });
  describe("parametrization of APR bonus", async function () {
    it("should get gamma array", async function () {
      Expect(await moe_treasury.getGamma()).to.equal([0, 1, 1, 0]);
    });
    it("should set gamma array", async function () {
      await moe_treasury.setGamma([1, 2, 3, 4]);
      Expect(await moe_treasury.getGamma()).to.equal([1, 2, 3, 4]);
    });
    it("should *not* set gamma array (invalid array.length)", async function () {
      expect(
        await moe_treasury.setGamma([1, 2, 3]).catch((ex) => {
          const m = ex.message.match(/invalid array.length/);
          if (m === null) console.debug(ex);
          expect().to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await moe_treasury.getGamma()).to.equal([0, 1, 1, 0]);
    });
    it("should *not* set gamma array (not owner)", async function () {
      const [owner, signer_1] = await ethers.getSigners();
      expect(
        await moe_treasury
          .connect(signer_1)
          .setGamma([1, 2, 3, 4])
          .catch((ex) => {
            const m = ex.message.match(/caller is not the owner/);
            if (m === null) console.debug(ex);
            expect().to.be.not.null;
          })
      ).to.eq(undefined);
      Expect(await moe_treasury.getGamma()).to.equal([0, 1, 1, 0]);
    });
  });
});
function Expect(array) {
  return expect(array.map((bn) => bn.toNumber())).deep;
}
