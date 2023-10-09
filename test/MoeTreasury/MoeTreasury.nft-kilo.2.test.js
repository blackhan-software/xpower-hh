const { ethers, network } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Sov, Nft, Ppt, Mty, Nty; // contract
let moe, sov, nft, ppt, mty, nty; // instance
let UNIT; // decimals

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
const YEAR = 365.25 * 86_400; // [seconds]

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
    Moe = await ethers.getContractFactory("XPowerTest");
    expect(Moe).to.be.an("object");
    Sov = await ethers.getContractFactory("APower");
    expect(Sov).to.be.an("object");
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.be.an("object");
    Ppt = await ethers.getContractFactory("XPowerPpt");
    expect(Ppt).to.be.an("object");
    Mty = await ethers.getContractFactory("MoeTreasury");
    expect(Mty).to.be.an("object");
    Nty = await ethers.getContractFactory("NftTreasury");
    expect(Nty).to.be.an("object");
  });
  before(async function () {
    moe = await Moe.deploy([], 0);
    expect(moe).to.be.an("object");
    await moe.init();
    sov = await Sov.deploy(moe.target, [], 0);
    expect(sov).to.be.an("object");
  });
  before(async function () {
    const decimals = await moe.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.eq(true);
  });
  before(async function () {
    nft = await Nft.deploy(moe.target, NFT_XPOW_URL, [], 0);
    expect(nft).to.be.an("object");
    ppt = await Ppt.deploy(NFT_XPOW_URL, [], 0);
    expect(ppt).to.be.an("object");
  });
  before(async function () {
    mty = await Mty.deploy(moe.target, sov.target, ppt.target);
    expect(mty).to.be.an("object");
    nty = await Nty.deploy(nft.target, ppt.target, mty.target);
    expect(nty).to.be.an("object");
  });
  before(async function () {
    await sov.transferOwnership(mty.target);
    expect(await sov.owner()).to.eq(mty.target);
  });
  before(async function () {
    await mintToken(1347n * UNIT);
    const supply = await moe.totalSupply();
    expect(supply).to.be.gte(1347n * UNIT);
  });
  before(async function () {
    await increaseAllowanceBy(1000n * UNIT, nft.target);
  });
  before(async function () {
    await moe.transfer(mty.target, 347n * UNIT);
  });
  describe("moeBalance", async function () {
    it("should return 347 [XPOW]", async function () {
      expect(await moe.balanceOf(mty.target)).to.closeTo(347n * UNIT, UNIT);
    });
  });
  describe("claim", async function () {
    it("should return 5.3m [APOW] in 120 months", async function () {
      const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.lt(UNIT);
      expect(await mty.claimed(account, nft_id)).to.lt(UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(347n * UNIT, UNIT);
      // wait for +6 months: 1st year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(16n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(16n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(331n * UNIT, UNIT);
      // wait for +6 months: 1st year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(33n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(33n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(314n * UNIT, UNIT);
      // APOW balance:
      expect(await sov.balanceOf(account)).to.closeTo(525_960n * UNIT, UNIT);
      // check balances & burn[-from] aged tokens:
      expect(await moe.balanceOf(sov.target)).to.closeTo(33n * UNIT, UNIT);
      expect(await sov.balanceOf(account)).to.closeTo(525_960n * UNIT, UNIT);
      const old_xp = await moe.balanceOf(account);
      await sov.increaseAllowance(account, (525_960n * UNIT) / 2n);
      await sov.burnFrom(account, (525_960n * UNIT) / 2n);
      await sov.burn((525_960n * UNIT) / 2n);
      expect(await moe.balanceOf(account)).to.be.closeTo(
        old_xp + 33n * UNIT,
        UNIT,
      );
      expect(await moe.balanceOf(sov.target)).to.closeTo(0, UNIT);
      expect(await sov.balanceOf(account)).to.closeTo(0, UNIT);
      // wait for +6 months: 2nd year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(50n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(50n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(297n * UNIT, UNIT);
      // wait for +6 months: 2nd year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(67n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(67n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(280n * UNIT, UNIT);
      // wait for +6 months: 3rd year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(85n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(85n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(262n * UNIT, UNIT);
      // wait for +6 months: 3rd year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(102n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(102n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(245n * UNIT, UNIT);
      // wait for +6 months: 4th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(119n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(119n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(228n * UNIT, UNIT);
      // wait for +6 months: 4th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(136n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(136n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(211n * UNIT, UNIT);
      // wait for +6 months: 5th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(154n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(154n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(193n * UNIT, UNIT);
      // wait for +6 months: 5th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(171n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(171n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(176n * UNIT, UNIT);
      // wait for +6 months: 6th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(188n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(188n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(159n * UNIT, UNIT);
      // wait for +6 months: 6th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(206n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(206n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(141n * UNIT, UNIT);
      // wait for +6 months: 7th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(223n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(223n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(124n * UNIT, UNIT);
      // wait for +6 months: 7th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(241n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(241n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(106n * UNIT, UNIT);
      // wait for +6 months: 8th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(259n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(259n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(88n * UNIT, UNIT);
      // wait for +6 months: 8th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(276n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(276n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(71n * UNIT, UNIT);
      // wait for +6 months: 9th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(294n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(294n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(53n * UNIT, UNIT);
      // wait for +6 months: 9th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(311n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(311n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(36n * UNIT, UNIT);
      // wait for +6 months: 10th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(330n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(330n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.closeTo(17n * UNIT, UNIT);
      // wait for +6 months: 10th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(347n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(347n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.lt(UNIT);
      // wait for +12 months: 11th year (empty treasury)
      await network.provider.send("evm_increaseTime", [YEAR * 1.0]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.closeTo(383n * UNIT, UNIT);
      expect(await mty.claimed(account, nft_id)).to.closeTo(383n * UNIT, UNIT);
      expect(await mty.claimable(account, nft_id)).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.lt(UNIT);
      // APOW balance:
      expect(await sov.balanceOf(account)).to.closeTo(5_343_332n * UNIT, UNIT);
    });
  });
});
async function mintToken(amount) {
  const tx_mint = await moe.fake(addresses[0], amount);
  expect(tx_mint).to.be.an("object");
  const balance_0 = await moe.balanceOf(addresses[0]);
  expect(balance_0).to.be.gte(amount);
  const balance_1 = await moe.balanceOf(addresses[1]);
  expect(balance_1).to.lt(UNIT);
}
async function increaseAllowanceBy(amount, spender) {
  const tx_increase = await moe.increaseAllowance(spender, amount);
  expect(tx_increase).to.be.an("object");
  const allowance = await moe.allowance(addresses[0], spender);
  expect(allowance).to.gte(amount);
}
async function mintNft(level, amount) {
  const nft_id = await nft.idBy(await nft.year(), level);
  expect(nft_id).to.be.gt(0);
  const tx_mint = await nft.mint(addresses[0], level, amount);
  expect(tx_mint).to.be.an("object");
  const nft_balance = await nft.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(amount);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply).to.eq(amount);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(nft_balance > 0);
  return nft_id;
}
async function stakeNft(nft_id, amount) {
  const [account, address] = [addresses[0], nty.target];
  const tx_approval = await nft.setApprovalForAll(address, true);
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
  expect(nft_balance).to.eq(nft_balance_old - BigInt(amount));
  return [account, nft_id];
}
