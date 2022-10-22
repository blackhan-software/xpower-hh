/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let APower, XPower, Nft, NftStaked, NftTreasury, MoeTreasury; // contracts
let apower, xpower, nft, nft_staked, nft_treasury, moe_treasury, mt; // instances
let UNUM; // decimals

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const NFT_ODIN_URL = "https://xpowermine.com/nfts/odin/{id}.json";
const NONE_ADDRESS = "0x0000000000000000000000000000000000000000";
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
    const decimals = await xpower.decimals();
    expect(decimals).to.greaterThan(0);
    UNUM = 10n ** BigInt(decimals);
    expect(UNUM >= 1n).to.be.true;
  });
  beforeEach(async function () {
    apower = await APower.deploy(NONE_ADDRESS, DEADLINE, xpower.address);
    expect(apower).to.exist;
    await apower.deployed();
  });
  beforeEach(async function () {
    table = await new HashTable(xpower, addresses[0]).init({
      length: 2n,
      min_level: 5,
      max_level: 5,
      use_cache: true,
    });
  });
  beforeEach(async function () {
    nft = await Nft.deploy(
      NFT_ODIN_URL,
      NONE_ADDRESS,
      DEADLINE,
      xpower.address
    );
    expect(nft).to.exist;
    await nft.deployed();
    nft_staked = await NftStaked.deploy(NFT_ODIN_URL, NONE_ADDRESS, DEADLINE);
    expect(nft_staked).to.exist;
    await nft_staked.deployed();
    nft_treasury = await NftTreasury.deploy(nft.address, nft_staked.address);
    expect(nft_treasury).to.exist;
    await nft_treasury.deployed();
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
  beforeEach(async function () {
    while (true)
      try {
        await mintToken(1_048_575);
      } catch (ex) {
        break;
      }
    table.reset();
  });
  beforeEach(async function () {
    const supply = await xpower.totalSupply();
    expect(supply).to.be.gte(1_180_09n * UNUM);
  });
  beforeEach(async function () {
    await increaseAllowanceBy(1_000_000n * UNUM, nft.address);
  });
  beforeEach(async function () {
    await xpower.transfer(moe_treasury.address, 210_000n * UNUM);
  });
  describe("balance", async function () {
    it("should return 601'000 [ODIN]", async function () {
      expect(await moe_treasury.balance()).to.eq(210_000n * UNUM);
    });
  });
  describe("claimFor", async function () {
    it("should return 601'000 [ODIN] in 120 months", async function () {
      const [account, nft_id] = await stakeNft(await mintNft(6, 1), 1);
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
      expect(await mt.balance()).to.eq(210_000n * UNUM);
      // wait for +12 months: 1st year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(20_100n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(20_100n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(20_100n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(20_100n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.balance()).to.eq(210_000n * UNUM - 20_100n * UNUM);
      // check balances & burn[-from] aged tokens:
      expect(await xpower.balanceOf(apower.address)).to.eq(20_100n * UNUM);
      expect(await apower.balanceOf(account)).to.eq(20_100n * UNUM);
      const old_xp = await xpower.balanceOf(account);
      await apower.increaseAllowance(account, 10_050n * UNUM);
      await apower.burnFrom(account, 10_050n * UNUM);
      await apower.burn(10_050n * UNUM);
      expect(await xpower.balanceOf(account)).to.eq(old_xp.add(20_100n * UNUM));
      expect(await xpower.balanceOf(apower.address)).to.eq(0);
      expect(await apower.balanceOf(account)).to.eq(0);
      // wait for +12 months: 2nd year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(40_400n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(40_400n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(40_400n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(40_400n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.balance()).to.eq(210_000n * UNUM - 40_400n * UNUM);
      // wait for +12 months: 3rd year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(60_900n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(60_900n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(60_900n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(60_900n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.balance()).to.eq(210_000n * UNUM - 60_900n * UNUM);
      // wait for +12 months: 4th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(81_600n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(81_600n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(81_600n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(81_600n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.balance()).to.eq(210_000n * UNUM - 81_600n * UNUM);
      // wait for +12 months: 5th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(102_500n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(102_500n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(102_500n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(102_500n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.balance()).to.eq(210_000n * UNUM - 102_500n * UNUM);
      // wait for +12 months: 6th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(123_600n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(123_600n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(123_600n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(123_600n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.balance()).to.eq(210_000n * UNUM - 123_600n * UNUM);
      // wait for +12 months: 7th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(144_900n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(144_900n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(144_900n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(144_900n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.balance()).to.eq(210_000n * UNUM - 144_900n * UNUM);
      // wait for +12 months: 8th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(166_400n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(166_400n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(166_400n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(166_400n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.balance()).to.eq(210_000n * UNUM - 166_400n * UNUM);
      // wait for +12 months: 9th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(188_100n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(188_100n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(188_100n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(188_100n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.balance()).to.eq(210_000n * UNUM - 188_100n * UNUM);
      // wait for +12 months: 10th year
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimFor(account, nft_id)).to.be.an("object");
      expect(await mt.rewardOf(account, nft_id)).to.eq(210_000n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(210_000n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(210_000n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(210_000n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(0);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
      expect(await mt.balance()).to.eq(210_000n * UNUM - 210_000n * UNUM);
      // wait for +12 months: 11th year (empty treasury)
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(
        await mt.claimFor(account, nft_id).catch((ex) => {
          const m = ex.message.match(/transfer amount exceeds balance/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      expect(await mt.rewardOf(account, nft_id)).to.eq(232_100n * UNUM);
      expect(await mt.totalRewardOf(nft_id)).to.eq(232_100n * UNUM);
      expect(await mt.claimedFor(account, nft_id)).to.eq(210_000n * UNUM);
      expect(await mt.totalClaimedFor(nft_id)).to.eq(210_000n * UNUM);
      expect(await mt.claimableFor(account, nft_id)).to.eq(22_100n * UNUM);
      expect(await mt.totalClaimableFor(nft_id)).to.eq(22_100n * UNUM);
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
  const nft_id = await nft.idBy(await nft.year(), level);
  expect(nft_id.gt(0)).to.eq(true);
  const tx_mint = await nft.mint(addresses[0], level, amount);
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
