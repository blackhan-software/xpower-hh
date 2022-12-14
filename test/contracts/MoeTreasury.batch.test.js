/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let APower, XPower, Nft, Ppt, NftTreasury, MoeTreasury; // contracts
let apower, xpower, nft, nft_staked, nft_treasury, moe_treasury, mt; // instances
let UNUM, UNUM_BN; // decimals
const ZERO = BigNumber.from(0);

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const NFT_ODIN_URL = "https://xpowermine.com/nfts/odin/{id}.json";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years
const DAYS = 86_400; // [seconds]

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
    const decimals = await xpower.decimals();
    expect(decimals).to.greaterThan(0);
    UNUM = 10n ** BigInt(decimals);
    expect(UNUM >= 1n).to.be.true;
    UNUM_BN = BigNumber.from(UNUM);
  });
  before(async function () {
    apower = await APower.deploy(xpower.address, [], DEADLINE);
    expect(apower).to.exist;
    await apower.deployed();
  });
  before(async function () {
    table = await new HashTable(xpower, addresses[0]).init({
      length: 4n,
      min_level: 1,
      max_level: 2,
      use_cache: true,
    });
  });
  before(async function () {
    nft = await Nft.deploy(NFT_ODIN_URL, [xpower.address], [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
  });
  before(async function () {
    nft_staked = await Ppt.deploy(NFT_ODIN_URL, [], DEADLINE);
    expect(nft_staked).to.exist;
    await nft_staked.deployed();
  });
  before(async function () {
    nft_treasury = await NftTreasury.deploy(nft.address, nft_staked.address);
    expect(nft_treasury).to.exist;
    await nft_treasury.deployed();
  });
  before(async function () {
    moe_treasury = await MoeTreasury.deploy(
      apower.address,
      xpower.address,
      nft_staked.address
    );
    expect(moe_treasury).to.exist;
    await moe_treasury.deployed();
    mt = moe_treasury;
  });
  before(async function () {
    await apower.transferOwnership(moe_treasury.address);
    expect(await apower.owner()).to.eq(moe_treasury.address);
  });
  before(async function () {
    while (true)
      try {
        await mintToken(255);
      } catch (ex) {
        break;
      }
    while (true)
      try {
        await mintToken(15);
      } catch (ex) {
        break;
      }
    table.reset();
  });
  before(async function () {
    const supply = await xpower.totalSupply();
    await increaseAllowanceBy(supply, nft.address);
  });
  before(async function () {
    await xpower.transfer(moe_treasury.address, 32n * UNUM);
  });
  describe("balance", async function () {
    it("should return 32 [ODIN]", async function () {
      expect(await moe_treasury.balance()).to.eq(32n * UNUM);
    });
  });
  describe("claimForBatch", async function () {
    it("should return 32 [ODIN] in 36 months", async function () {
      const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
      expect(
        await mt.claimForBatch(account, [nft_id]).catch((ex) => {
          const m = ex.message.match(/nothing claimable/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await mt.rewardOfBatch(account, [nft_id])).to.eq([ZERO]);
      Expect(await mt.totalRewardOfBatch([nft_id])).to.eq([ZERO]);
      Expect(await mt.claimedForBatch(account, [nft_id])).to.eq([ZERO]);
      Expect(await mt.totalClaimedForBatch([nft_id])).to.eq([ZERO]);
      Expect(await mt.claimableForBatch(account, [nft_id])).to.eq([ZERO]);
      Expect(await mt.totalClaimableForBatch([nft_id])).to.eq([ZERO]);
      expect(await mt.balance()).to.eq(32n * UNUM);
      // wait for +6 months:
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.5]);
      expect(await mt.claimForBatch(account, [nft_id])).to.be.an("object");
      Expect(await mt.rewardOfBatch(account, [nft_id])).to.eq([UNUM_BN.mul(5)]);
      Expect(await mt.totalRewardOfBatch([nft_id])).to.eq([UNUM_BN.mul(5)]);
      Expect(await mt.claimedForBatch(account, [nft_id])).to.eq([
        UNUM_BN.mul(5),
      ]);
      Expect(await mt.totalClaimedForBatch([nft_id])).to.eq([UNUM_BN.mul(5)]);
      Expect(await mt.claimableForBatch(account, [nft_id])).to.eq([ZERO]);
      Expect(await mt.totalClaimableForBatch([nft_id])).to.eq([ZERO]);
      expect(await mt.balance()).to.eq(27n * UNUM);
      // wait for +6 months:
      await network.provider.send("evm_increaseTime", [465.25 * DAYS * 0.5]);
      expect(await mt.claimForBatch(account, [nft_id])).to.be.an("object");
      Expect(await mt.rewardOfBatch(account, [nft_id])).to.eq([
        UNUM_BN.mul(11),
      ]);
      Expect(await mt.totalRewardOfBatch([nft_id])).to.eq([UNUM_BN.mul(11)]);
      Expect(await mt.claimedForBatch(account, [nft_id])).to.eq([
        UNUM_BN.mul(11),
      ]);
      Expect(await mt.totalClaimedForBatch([nft_id])).to.eq([UNUM_BN.mul(11)]);
      Expect(await mt.claimableForBatch(account, [nft_id])).to.eq([ZERO]);
      Expect(await mt.totalClaimableForBatch([nft_id])).to.eq([ZERO]);
      expect(await mt.balance()).to.eq(21n * UNUM);
      // wait for +4 months:
      await network.provider.send("evm_increaseTime", [
        Math.round(365.25 * DAYS * 0.334),
      ]);
      expect(await mt.claimForBatch(account, [nft_id])).to.be.an("object");
      Expect(await mt.rewardOfBatch(account, [nft_id])).to.eq([
        UNUM_BN.mul(14),
      ]);
      Expect(await mt.totalRewardOfBatch([nft_id])).to.eq([UNUM_BN.mul(14)]);
      Expect(await mt.claimedForBatch(account, [nft_id])).to.eq([
        UNUM_BN.mul(14),
      ]);
      Expect(await mt.totalClaimedForBatch([nft_id])).to.eq([UNUM_BN.mul(14)]);
      Expect(await mt.claimableForBatch(account, [nft_id])).to.eq([ZERO]);
      Expect(await mt.totalClaimableForBatch([nft_id])).to.eq([ZERO]);
      expect(await mt.balance()).to.eq(18n * UNUM);
      // wait for +8 months:
      await network.provider.send("evm_increaseTime", [
        Math.round(365.25 * DAYS * 0.667),
      ]);
      expect(await mt.claimForBatch(account, [nft_id])).to.be.an("object");
      Expect(await mt.rewardOfBatch(account, [nft_id])).to.eq([
        UNUM_BN.mul(21),
      ]);
      Expect(await mt.totalRewardOfBatch([nft_id])).to.eq([UNUM_BN.mul(21)]);
      Expect(await mt.claimedForBatch(account, [nft_id])).to.eq([
        UNUM_BN.mul(21),
      ]);
      Expect(await mt.totalClaimedForBatch([nft_id])).to.eq([UNUM_BN.mul(21)]);
      Expect(await mt.claimableForBatch(account, [nft_id])).to.eq([ZERO]);
      Expect(await mt.totalClaimableForBatch([nft_id])).to.eq([ZERO]);
      expect(await mt.balance()).to.eq(11n * UNUM);
      // wait for +12 months:
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimForBatch(account, [nft_id])).to.be.an("object");
      Expect(await mt.rewardOfBatch(account, [nft_id])).to.eq([
        UNUM_BN.mul(32),
      ]);
      Expect(await mt.totalRewardOfBatch([nft_id])).to.eq([UNUM_BN.mul(32)]);
      Expect(await mt.claimedForBatch(account, [nft_id])).to.eq([
        UNUM_BN.mul(32),
      ]);
      Expect(await mt.totalClaimedForBatch([nft_id])).to.eq([UNUM_BN.mul(32)]);
      Expect(await mt.claimableForBatch(account, [nft_id])).to.eq([ZERO]);
      Expect(await mt.totalClaimableForBatch([nft_id])).to.eq([ZERO]);
      expect(await mt.balance()).to.eq(0n);
      // wait for +12 months: (empty treasury)
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(
        await mt.claimForBatch(account, [nft_id]).catch((ex) => {
          const m = ex.message.match(/transfer amount exceeds balance/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await mt.rewardOfBatch(account, [nft_id])).to.eq([
        UNUM_BN.mul(43),
      ]);
      Expect(await mt.totalRewardOfBatch([nft_id])).to.eq([UNUM_BN.mul(43)]);
      Expect(await mt.claimedForBatch(account, [nft_id])).to.eq([
        UNUM_BN.mul(32),
      ]);
      Expect(await mt.totalClaimedForBatch([nft_id])).to.eq([UNUM_BN.mul(32)]);
      Expect(await mt.claimableForBatch(account, [nft_id])).to.eq([
        UNUM_BN.mul(11),
      ]);
      Expect(await mt.totalClaimableForBatch([nft_id])).to.eq([
        UNUM_BN.mul(11),
      ]);
      expect(await mt.balance()).to.eq(0);
    });
  });
});
async function mintToken(amount) {
  const [nonce, block_hash] = table.nextNonce({ amount });
  expect(nonce).to.gte(0);
  const tx_cache = await xpower.cache(block_hash);
  expect(tx_cache).to.be.an("object");
  const tx_mint = await xpower.mint(addresses[0], block_hash, nonce);
  expect(tx_mint).to.be.an("object");
  const balance_0 = await xpower.balanceOf(addresses[0]);
  expect(balance_0).to.be.gte(amount);
  const balance_1 = await xpower.balanceOf(addresses[1]);
  expect(balance_1).to.eq(0);
}
async function increaseAllowanceBy(amount, spender) {
  const tx_increase = await xpower.increaseAllowance(spender, amount);
  expect(tx_increase).to.be.an("object");
  const allowance = await xpower.allowance(addresses[0], spender);
  expect(allowance).to.gte(amount);
}
async function mintNft(level, amount) {
  const moe_prefix = await xpower.prefix();
  const nft_id = await nft.idBy(await nft.year(), level, moe_prefix);
  expect(nft_id.gt(0)).to.eq(true);
  const moe_index = await nft.moeIndexOf(xpower.address);
  const tx_mint = await nft.mint(addresses[0], level, amount, moe_index);
  expect(tx_mint).to.be.an("object");
  const nft_balance = await nft.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(amount);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply).to.eq(amount);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(nft_balance.gt(0));
  return nft_id;
}
async function stakeNft(nft_id, amount) {
  const [account, address] = [addresses[0], nft_treasury.address];
  const tx_approval = await await nft.setApprovalForAll(address, true);
  expect(tx_approval).to.be.an("object");
  const tx_transfer = await nft_staked.transferOwnership(address);
  expect(tx_transfer).to.be.an("object");
  const nft_balance_old = await nft.balanceOf(account, nft_id);
  expect(nft_balance_old).to.gte(amount);
  const tx_stake = await nft_treasury.stake(account, nft_id, amount);
  expect(tx_stake).to.be.an("object");
  const nft_staked_balance = await nft_staked.balanceOf(account, nft_id);
  expect(nft_staked_balance).to.be.gte(amount);
  const nft_treasury_balance = await nft.balanceOf(address, nft_id);
  expect(nft_treasury_balance).to.be.gte(amount);
  const nft_balance = await nft.balanceOf(account, nft_id);
  expect(nft_balance).to.eq(nft_balance_old.sub(amount));
  return [account, nft_id];
}
function Expect(array) {
  return expect(array.map((bn) => bn)).deep;
}
