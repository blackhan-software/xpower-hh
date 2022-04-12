/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower, Nft, NftStaked, NftTreasury, MoeTreasury; // contracts
let xpower, nft, nft_staked, nft_treasury, moe_treasury, mt; // instances

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const NFT_QRSH_URL = "https://xpowermine.com/nfts/qrsh/{id}.json";
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
    table = await new HashTable(xpower, addresses[0]).init({
      length: 4n,
      min_level: 1,
      max_level: 2,
      use_cache: true,
    });
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
  beforeEach(async function () {
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
  beforeEach(async function () {
    const supply = await xpower.totalSupply();
    expect(supply.toNumber()).to.be.gte(1100);
  });
  beforeEach(async function () {
    await increaseAllowanceBy(1000, nft.address);
  });
  beforeEach(async function () {
    await xpower.transfer(moe_treasury.address, 90);
  });
  describe("balance", async function () {
    it("should return 90 [QRSH]", async function () {
      expect(await moe_treasury.balance()).to.eq(90);
    });
  });
  describe("claimForBatch", async function () {
    it("should return 90 [QRSH] in 36 months", async function () {
      const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
      expect(
        await mt.claimForBatch(account, [nft_id]).catch((ex) => {
          const m = ex.message.match(/nothing claimable/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await mt.rewardOfBatch(account, [nft_id])).to.eq([0]);
      Expect(await mt.totalRewardOfBatch([nft_id])).to.eq([0]);
      Expect(await mt.claimedForBatch(account, [nft_id])).to.eq([0]);
      Expect(await mt.totalClaimedForBatch([nft_id])).to.eq([0]);
      Expect(await mt.claimableForBatch(account, [nft_id])).to.eq([0]);
      Expect(await mt.totalClaimableForBatch([nft_id])).to.eq([0]);
      expect(await mt.balance()).to.eq(90);
      // wait for +6 months:
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.5]);
      expect(await mt.claimForBatch(account, [nft_id])).to.be.an("object");
      Expect(await mt.rewardOfBatch(account, [nft_id])).to.eq([15]);
      Expect(await mt.totalRewardOfBatch([nft_id])).to.eq([15]);
      Expect(await mt.claimedForBatch(account, [nft_id])).to.eq([15]);
      Expect(await mt.totalClaimedForBatch([nft_id])).to.eq([15]);
      Expect(await mt.claimableForBatch(account, [nft_id])).to.eq([0]);
      Expect(await mt.totalClaimableForBatch([nft_id])).to.eq([0]);
      expect(await mt.balance()).to.eq(75);
      // wait for +6 months:
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.5]);
      expect(await mt.claimForBatch(account, [nft_id])).to.be.an("object");
      Expect(await mt.rewardOfBatch(account, [nft_id])).to.eq([30]);
      Expect(await mt.totalRewardOfBatch([nft_id])).to.eq([30]);
      Expect(await mt.claimedForBatch(account, [nft_id])).to.eq([30]);
      Expect(await mt.totalClaimedForBatch([nft_id])).to.eq([30]);
      Expect(await mt.claimableForBatch(account, [nft_id])).to.eq([0]);
      Expect(await mt.totalClaimableForBatch([nft_id])).to.eq([0]);
      expect(await mt.balance()).to.eq(60);
      // wait for +4 months:
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.334]);
      expect(await mt.claimForBatch(account, [nft_id])).to.be.an("object");
      Expect(await mt.rewardOfBatch(account, [nft_id])).to.eq([40]);
      Expect(await mt.totalRewardOfBatch([nft_id])).to.eq([40]);
      Expect(await mt.claimedForBatch(account, [nft_id])).to.eq([40]);
      Expect(await mt.totalClaimedForBatch([nft_id])).to.eq([40]);
      Expect(await mt.claimableForBatch(account, [nft_id])).to.eq([0]);
      Expect(await mt.totalClaimableForBatch([nft_id])).to.eq([0]);
      expect(await mt.balance()).to.eq(50);
      // wait for +8 months:
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.667]);
      expect(await mt.claimForBatch(account, [nft_id])).to.be.an("object");
      Expect(await mt.rewardOfBatch(account, [nft_id])).to.eq([60]);
      Expect(await mt.totalRewardOfBatch([nft_id])).to.eq([60]);
      Expect(await mt.claimedForBatch(account, [nft_id])).to.eq([60]);
      Expect(await mt.totalClaimedForBatch([nft_id])).to.eq([60]);
      Expect(await mt.claimableForBatch(account, [nft_id])).to.eq([0]);
      Expect(await mt.totalClaimableForBatch([nft_id])).to.eq([0]);
      expect(await mt.balance()).to.eq(30);
      // wait for +12 months:
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mt.claimForBatch(account, [nft_id])).to.be.an("object");
      Expect(await mt.rewardOfBatch(account, [nft_id])).to.eq([90]);
      Expect(await mt.totalRewardOfBatch([nft_id])).to.eq([90]);
      Expect(await mt.claimedForBatch(account, [nft_id])).to.eq([90]);
      Expect(await mt.totalClaimedForBatch([nft_id])).to.eq([90]);
      Expect(await mt.claimableForBatch(account, [nft_id])).to.eq([0]);
      Expect(await mt.totalClaimableForBatch([nft_id])).to.eq([0]);
      expect(await mt.balance()).to.eq(0);
      // wait for +12 months: (empty treasury)
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(
        await mt.claimForBatch(account, [nft_id]).catch((ex) => {
          const m = ex.message.match(/transfer amount exceeds balance/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      Expect(await mt.rewardOfBatch(account, [nft_id])).to.eq([120]);
      Expect(await mt.totalRewardOfBatch([nft_id])).to.eq([120]);
      Expect(await mt.claimedForBatch(account, [nft_id])).to.eq([90]);
      Expect(await mt.totalClaimedForBatch([nft_id])).to.eq([90]);
      Expect(await mt.claimableForBatch(account, [nft_id])).to.eq([30]);
      Expect(await mt.totalClaimableForBatch([nft_id])).to.eq([30]);
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
  expect(balance_0.toNumber()).to.be.gte(amount);
  const balance_1 = await xpower.balanceOf(addresses[1]);
  expect(balance_1.toNumber()).to.eq(0);
}
async function increaseAllowanceBy(amount, spender) {
  const tx_increase = await xpower.increaseAllowance(spender, amount);
  expect(tx_increase).to.be.an("object");
  const allowance = await xpower.allowance(addresses[0], spender);
  expect(allowance.toNumber()).to.gte(amount);
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
  expect(nft_balance_old.toNumber()).to.gte(amount);
  const tx_stake = await nft_treasury.stake(account, nft_id, amount);
  expect(tx_stake).to.be.an("object");
  const nft_staked_balance = await nft_staked.balanceOf(account, nft_id);
  expect(nft_staked_balance.toNumber()).to.be.gte(amount);
  const nft_treasury_balance = await nft.balanceOf(address, nft_id);
  expect(nft_treasury_balance.toNumber()).to.be.gte(amount);
  const nft_balance = await nft.balanceOf(account, nft_id);
  expect(nft_balance.toNumber()).to.eq(nft_balance_old.sub(amount));
  return [account, nft_id];
}
function Expect(array) {
  return expect(array.map((bn) => bn.toNumber())).deep;
}
