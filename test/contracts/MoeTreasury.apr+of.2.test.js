/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let APower, XPower, Nft, Ppt, NftTreasury, MoeTreasury; // contracts
let apower, xpower, nft, ppt, nft_treasury, moe_treasury, mt; // instances

const NFT_ODIN_URL = "https://xpowermine.com/nfts/thor/{id}.json";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years
const MONTH = 2_629_800; // [seconds]

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
    APower = await ethers.getContractFactory("APowerThor");
    expect(APower).to.exist;
    XPower = await ethers.getContractFactory("XPowerThorTest");
    expect(XPower).to.exist;
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
  before(async function () {
    xpower = await XPower.deploy([], DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
    await xpower.init();
  });
  before(async function () {
    apower = await APower.deploy(xpower.address, [], DEADLINE);
    expect(apower).to.exist;
    await apower.deployed();
  });
  before(async function () {
    nft = await Nft.deploy(NFT_ODIN_URL, [xpower.address], [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
  });
  before(async function () {
    ppt = await Ppt.deploy(NFT_ODIN_URL, [], DEADLINE);
    expect(ppt).to.exist;
    await ppt.deployed();
  });
  before(async function () {
    nft_treasury = await NftTreasury.deploy(nft.address, ppt.address);
    expect(nft_treasury).to.exist;
    await nft_treasury.deployed();
  });
  before(async function () {
    mt = moe_treasury = await MoeTreasury.deploy(
      [xpower.address],
      [apower.address],
      ppt.address
    );
    expect(mt).to.exist;
    await mt.deployed();
  });
  before(async function () {
    await apower.transferOwnership(mt.address);
    expect(await apower.owner()).to.eq(mt.address);
  });
  describe("grant-role", async function () {
    it(`should grant reparametrization right`, async function () {
      await moe_treasury.grantRole(moe_treasury.APR_BONUS_ROLE(), addresses[0]);
    });
  });
  describe("set-apr-bonus", async function () {
    it("should reparameterize at 0.010[%] (per nft.year)", async function () {
      const array = [0, 0, 1, 10_000];
      const tx = await moe_treasury.setAPRBonusBatch([1202103], array);
      expect(tx).to.not.eq(undefined);
    });
    it("should forward time by one month", async function () {
      await network.provider.send("evm_increaseTime", [MONTH]);
      await network.provider.send("evm_mine", []);
    });
  });
  describe("set-apr-bonus (monthly doubling for 24 months)", async function () {
    for (let m = 1; m <= 24; m++) {
      it("should print current & target values", async function () {
        const nft_id = await nft.idBy(new Date().getFullYear() - 1, 3, 1);
        const tgt = (await mt.aprBonusTargetOf(nft_id)).toString();
        const apr = (await mt.aprBonusOf(nft_id)).toString();
        console.debug("[APR_BONUS]", m, apr, tgt);
      });
      const p = pct(m);
      it(`should reparameterize at ${p}[‱] (per nft.year)`, async function () {
        const array = [0, 0, 1, 10_000 * 2 ** m];
        const tx = await moe_treasury.setAPRBonusBatch([1202103], array);
        expect(tx).to.not.eq(undefined);
      });
      it("should forward time by one month", async function () {
        await network.provider.send("evm_increaseTime", [MONTH]);
        await network.provider.send("evm_mine", []);
      });
    }
  });
});
function pct(m) {
  return 2 ** m;
}
