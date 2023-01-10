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
let UNUM; // decimals

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const NFT_ODIN_URL = "https://xodinmine.com/nfts/odin/{id}.json";
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
  before(async function () {
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
  before(async function () {
    const decimals = await xodin.decimals();
    expect(decimals).to.greaterThan(0);
    UNUM = 10n ** BigInt(decimals);
    expect(UNUM >= 1n).to.be.true;
  });
  before(async function () {
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
  before(async function () {
    table = await new HashTable(xodin, addresses[0]).init({
      length: 2n,
      min_level: 3,
      max_level: 3,
      use_cache: true,
    });
  });
  before(async function () {
    nft = await Nft.deploy(NFT_ODIN_URL, [xodin.address], [], DEADLINE);
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
  });
  before(async function () {
    await nft_treasury.deployed();
    moe_treasury = await MoeTreasury.deploy(
      [xthor.address, xloki.address, xodin.address],
      [athor.address, aloki.address, aodin.address],
      ppt.address
    );
    expect(moe_treasury).to.exist;
    await moe_treasury.deployed();
    mt = moe_treasury;
  });
  before(async function () {
    await athor.transferOwnership(moe_treasury.address);
    expect(await athor.owner()).to.eq(moe_treasury.address);
    await aloki.transferOwnership(moe_treasury.address);
    expect(await aloki.owner()).to.eq(moe_treasury.address);
    await aodin.transferOwnership(moe_treasury.address);
    expect(await aodin.owner()).to.eq(moe_treasury.address);
  });
  before(async function () {
    while (true)
      try {
        await mintToken(4095);
      } catch (ex) {
        break;
      }
    table.reset();
  });
  before(async function () {
    const supply = await xodin.totalSupply();
    expect(supply).to.be.gte(1601n * UNUM);
  });
  before(async function () {
    await increaseAllowanceBy(1000n * UNUM, nft.address);
  });
  before(async function () {
    await xodin.transfer(moe_treasury.address, 110n * UNUM);
  });
  describe("moeBalance", async function () {
    it("should return 110 [ODIN]", async function () {
      const moe_index = await moe_treasury.moeIndexOf(xodin.address);
      expect(await moe_treasury.moeBalanceOf(moe_index)).to.eq(110n * UNUM);
    });
  });
  describe("claimFor", async function () {
    it("should return 110 [ODIN] in 120 months", async function () {
      const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
      expect(
        await mt.claimFor(account, nft_id).catch((ex) => {
          const m = ex.message.match(/nothing claimable/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      expect(await mt.rewardOf(account, nft_id)).to.eq(0);
      expect(await mt.totalRewardOf(nft_id)).to.eq(0);
      expect(await mt.claimedFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(0);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.moeBalanceOf(2)).to.eq(110n * UNUM);
      // wait for +12 months: 1st year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(10n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(10n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(10n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(10n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.moeBalanceOf(2)).to.eq(100n * UNUM);
      // check balances & burn[-from] aged tokens:
      expect(await xodin.balanceOf(aodin.address)).to.eq(10n * UNUM);
      expect(await aodin.balanceOf(account)).to.eq(10n * UNUM);
      const old_xp = await xodin.balanceOf(account);
      await aodin.increaseAllowance(account, 5n * UNUM);
      await aodin.burnFrom(account, 5n * UNUM);
      await aodin.burn(5n * UNUM);
      expect(await xodin.balanceOf(account)).to.eq(old_xp.add(10n * UNUM));
      expect(await xodin.balanceOf(aodin.address)).to.eq(0);
      expect(await aodin.balanceOf(account)).to.eq(0);
      // wait for +12 months: 2nd year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(20n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(20n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(20n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(20n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.moeBalanceOf(2)).to.eq(90n * UNUM);
      // wait for +12 months: 3rd year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(30n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(30n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(30n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(30n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.moeBalanceOf(2)).to.eq(80n * UNUM);
      // wait for +12 months: 4th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(41n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(41n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(41n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(41n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.moeBalanceOf(2)).to.eq(69n * UNUM);
      // wait for +12 months: 5th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(52n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(52n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(52n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(52n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.moeBalanceOf(2)).to.eq(58n * UNUM);
      // wait for +12 months: 6th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(63n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(63n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(63n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(63n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.moeBalanceOf(2)).to.eq(47n * UNUM);
      // wait for +12 months: 7th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(74n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(74n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(74n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(74n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.moeBalanceOf(2)).to.eq(36n * UNUM);
      // wait for +12 months: 8th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(86n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(86n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(86n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(86n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.moeBalanceOf(2)).to.eq(24n * UNUM);
      // wait for +12 months: 9th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(98n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(98n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(98n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(98n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.moeBalanceOf(2)).to.eq(12n * UNUM);
      // wait for +12 months: 10th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(110n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(110n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(110n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(110n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.moeBalanceOf(2)).to.eq(0);
      // wait for +12 months: 11th year (empty treasury)
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(
        await mt.claimFor(account, nft_id).catch((ex) => {
          const m = ex.message.match(/transfer amount exceeds balance/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      expect(await mt.rewardOf(account, nft_id)).to.eq(122n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(122n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(110n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(110n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(12n * UNUM);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(12n * UNUM);
      expect(await mt.moeBalanceOf(2)).to.eq(0);
    });
  });
});
async function mintToken(amount) {
  const [nonce, block_hash] = table.nextNonce({ amount });
  expect(nonce).to.gte(0);
  const tx_cache = await xodin.cache(block_hash);
  expect(tx_cache).to.be.an("object");
  const tx_mint = await xodin.mint(addresses[0], block_hash, nonce);
  expect(tx_mint).to.be.an("object");
  const balance_0 = await xodin.balanceOf(addresses[0]);
  expect(balance_0).to.be.gte(amount);
  const balance_1 = await xodin.balanceOf(addresses[1]);
  expect(balance_1).to.eq(0);
}
async function increaseAllowanceBy(amount, spender) {
  const tx_increase = await xodin.increaseAllowance(spender, amount);
  expect(tx_increase).to.be.an("object");
  const allowance = await xodin.allowance(addresses[0], spender);
  expect(allowance).to.gte(amount);
}
async function mintNft(level, amount) {
  const moe_prefix = await xodin.prefix();
  const nft_id = await nft.idBy(await nft.year(), level, moe_prefix);
  expect(nft_id.gt(0)).to.eq(true);
  const moe_index = await nft.moeIndexOf(xodin.address);
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
  const tx_transfer = await ppt.transferOwnership(address);
  expect(tx_transfer).to.be.an("object");
  const nft_balance_old = await nft.balanceOf(account, nft_id);
  expect(nft_balance_old).to.gte(amount);
  const tx_stake = await nft_treasury.stake(account, nft_id, amount);
  expect(tx_stake).to.be.an("object");
  const nft_staked_balance = await ppt.balanceOf(account, nft_id);
  expect(nft_staked_balance).to.be.gte(amount);
  const nft_treasury_balance = await nft.balanceOf(address, nft_id);
  expect(nft_treasury_balance).to.be.gte(amount);
  const nft_balance = await nft.balanceOf(account, nft_id);
  expect(nft_balance).to.eq(nft_balance_old.sub(amount));
  return [account, nft_id];
}
