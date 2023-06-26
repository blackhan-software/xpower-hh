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
let UNIT; // decimals

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const NFT_THOR_URL = "https://xpowermine.com/nfts/odin/{id}.json";
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
    Mty = await ethers.getContractFactory("MoeTreasury");
    expect(Mty).to.exist;
    Nty = await ethers.getContractFactory("NftTreasury");
    expect(Nty).to.exist;
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
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.be.true;
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
      min_level: 1,
      max_level: 1,
    });
  });
  before(async function () {
    nft = await Nft.deploy(NFT_THOR_URL, [xodin.address], [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
    ppt = await Ppt.deploy(NFT_THOR_URL, [], DEADLINE);
    expect(ppt).to.exist;
    await ppt.deployed();
  });
  before(async function () {
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
  before(async function () {
    await athor.transferOwnership(mty.address);
    expect(await athor.owner()).to.eq(mty.address);
    await aloki.transferOwnership(mty.address);
    expect(await aloki.owner()).to.eq(mty.address);
    await aodin.transferOwnership(mty.address);
    expect(await aodin.owner()).to.eq(mty.address);
  });
  before(async function () {
    while (true)
      try {
        await mintToken(15);
      } catch (ex) {
        break;
      }
    table.reset();
  });
  before(async function () {
    const supply = await xodin.totalSupply();
    expect(supply).to.be.gte(15n * UNIT);
  });
  before(async function () {
    await increaseAllowanceBy(1n * UNIT, nft.address);
  });
  before(async function () {
    await xodin.transfer(mty.address, 0);
  });
  describe("moeBalance", async function () {
    it("should return 0 [ODIN]", async function () {
      const moe_index = await mty.moeIndexOf(xodin.address);
      expect(await mty.moeBalanceOf(moe_index)).to.eq(0n * UNIT);
    });
  });
  describe("claimFor", async function () {
    it("should set average APR to 1.00[%]", async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
      await mty.setAPR(3202100, [1_000_000, 2n ** 256n - 1n, 1_000_000]);
    });
    it("should return 0 [ODIN] in 120 months", async function () {
      const [account, nft_id] = await stakeNft(await mintNft(0, 1), 1);
      expect(
        await mty.claimFor(account, nft_id).catch((ex) => {
          const m = ex.message.match(/nothing claimable/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      expect(await mty.rewardOf(account, nft_id)).to.eq(0);
      expect(await mty.claimedFor(account, nft_id)).to.eq(0);
      expect(await mty.claimableFor(account, nft_id)).to.eq(0);
      expect(await mty.moeBalanceOf(2)).to.eq(0);
      // wait for +12 months: 1st year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      await network.provider.send("evm_mine");
      expect(await mty.rewardOf(account, nft_id)).to.eq(0);
      expect(await mty.claimedFor(account, nft_id)).to.eq(0);
      expect(await mty.claimableFor(account, nft_id)).to.eq(0);
      expect(await mty.moeBalanceOf(2)).to.eq(0);
      // check balances & burn[-from] aged tokens:
      expect(await xodin.balanceOf(aodin.address)).to.eq(0);
      expect(await aodin.balanceOf(account)).to.eq(0);
      const old_xp = await xodin.balanceOf(account);
      await aodin.increaseAllowance(account, 0);
      await aodin.burnFrom(account, 0);
      await aodin.burn(0);
      expect(await xodin.balanceOf(account)).to.eq(old_xp.add(0));
      expect(await xodin.balanceOf(aodin.address)).to.eq(0);
      expect(await aodin.balanceOf(account)).to.eq(0);
      // wait for +12 months: 2nd year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      await network.provider.send("evm_mine");
      expect(await mty.rewardOf(account, nft_id)).to.eq(0);
      expect(await mty.claimedFor(account, nft_id)).to.eq(0);
      expect(await mty.claimableFor(account, nft_id)).to.eq(0);
      expect(await mty.moeBalanceOf(2)).to.eq(0);
      // wait for +12 months: 3rd year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      await network.provider.send("evm_mine");
      expect(await mty.rewardOf(account, nft_id)).to.eq(0);
      expect(await mty.claimedFor(account, nft_id)).to.eq(0);
      expect(await mty.claimableFor(account, nft_id)).to.eq(0);
      expect(await mty.moeBalanceOf(2)).to.eq(0);
      // wait for +12 months: 4th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      await network.provider.send("evm_mine");
      expect(await mty.rewardOf(account, nft_id)).to.eq(0);
      expect(await mty.claimedFor(account, nft_id)).to.eq(0);
      expect(await mty.claimableFor(account, nft_id)).to.eq(0);
      expect(await mty.moeBalanceOf(2)).to.eq(0);
      // wait for +12 months: 5th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      await network.provider.send("evm_mine");
      expect(await mty.rewardOf(account, nft_id)).to.eq(0);
      expect(await mty.claimedFor(account, nft_id)).to.eq(0);
      expect(await mty.claimableFor(account, nft_id)).to.eq(0);
      expect(await mty.moeBalanceOf(2)).to.eq(0);
      // wait for +12 months: 6th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      await network.provider.send("evm_mine");
      expect(await mty.rewardOf(account, nft_id)).to.eq(0);
      expect(await mty.claimedFor(account, nft_id)).to.eq(0);
      expect(await mty.claimableFor(account, nft_id)).to.eq(0);
      expect(await mty.moeBalanceOf(2)).to.eq(0);
      // wait for +12 months: 7th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      await network.provider.send("evm_mine");
      expect(await mty.rewardOf(account, nft_id)).to.eq(0);
      expect(await mty.claimedFor(account, nft_id)).to.eq(0);
      expect(await mty.claimableFor(account, nft_id)).to.eq(0);
      expect(await mty.moeBalanceOf(2)).to.eq(0);
      // wait for +12 months: 8th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      await network.provider.send("evm_mine");
      expect(await mty.rewardOf(account, nft_id)).to.eq(0);
      expect(await mty.claimedFor(account, nft_id)).to.eq(0);
      expect(await mty.claimableFor(account, nft_id)).to.eq(0);
      expect(await mty.moeBalanceOf(2)).to.eq(0);
      // wait for +12 months: 9th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      await network.provider.send("evm_mine");
      expect(await mty.rewardOf(account, nft_id)).to.eq(0);
      expect(await mty.claimedFor(account, nft_id)).to.eq(0);
      expect(await mty.claimableFor(account, nft_id)).to.eq(0);
      expect(await mty.moeBalanceOf(2)).to.eq(0);
      // wait for +12 months: 10th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      await network.provider.send("evm_mine");
      expect(await mty.rewardOf(account, nft_id)).to.eq(0);
      expect(await mty.claimedFor(account, nft_id)).to.eq(0);
      expect(await mty.claimableFor(account, nft_id)).to.eq(0);
      expect(await mty.moeBalanceOf(2)).to.eq(0);
      // wait for +12 months: 11th year (nothing claimable)
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(
        await mty.claimFor(account, nft_id).catch((ex) => {
          const m = ex.message.match(/nothing claimable/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      expect(await mty.rewardOf(account, nft_id)).to.eq(0);
      expect(await mty.claimedFor(account, nft_id)).to.eq(0);
      expect(await mty.claimableFor(account, nft_id)).to.eq(0);
      expect(await mty.moeBalanceOf(2)).to.eq(0);
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
  const [account, address] = [addresses[0], nty.address];
  const tx_approval = await await nft.setApprovalForAll(address, true);
  expect(tx_approval).to.be.an("object");
  const tx_transfer = await ppt.transferOwnership(address);
  expect(tx_transfer).to.be.an("object");
  const nft_balance_old = await nft.balanceOf(account, nft_id);
  expect(nft_balance_old).to.gte(amount);
  const tx_stake = await nty.stake(account, nft_id, amount);
  expect(tx_stake).to.be.an("object");
  const nft_staked_balance = await ppt.balanceOf(account, nft_id);
  expect(nft_staked_balance).to.be.gte(amount);
  const nft_treasury_balance = await nft.balanceOf(address, nft_id);
  expect(nft_treasury_balance).to.be.gte(amount);
  const nft_balance = await nft.balanceOf(account, nft_id);
  expect(nft_balance).to.eq(nft_balance_old.sub(amount));
  return [account, nft_id];
}
