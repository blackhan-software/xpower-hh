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
      expect(await moe.balanceOf(mty.target)).to.eq(347n * UNIT);
    });
  });
  describe("claim", async function () {
    it("should return 20 [APOW] in 120 months", async function () {
      const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
      expect(
        await mty.claim(account, nft_id).catch((ex) => {
          const m = ex.message.match(/nothing claimable/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
      expect(await mty.rewardOf(account, nft_id)).to.eq(0);
      expect(await mty.claimed(account, nft_id)).to.eq(0);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(347n * UNIT);
      // wait for +6 months: 1st year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(16n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(16n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(331n * UNIT);
      // wait for +6 months: 1st year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(33n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(33n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(314n * UNIT);
      // APOW balance:
      expect(await sov.balanceOf(account)).to.closeTo(533_929n * UNIT, UNIT);
      // check balances & burn[-from] aged tokens:
      expect(await moe.balanceOf(sov.target)).to.eq(33n * UNIT);
      expect(await sov.balanceOf(account)).to.closeTo(533_929n * UNIT, UNIT);
      const old_xp = await moe.balanceOf(account);
      await sov.increaseAllowance(account, (533_929n * UNIT) / 2n);
      await sov.burnFrom(account, (533_929n * UNIT) / 2n);
      await sov.burn((533_929n * UNIT) / 2n);
      expect(await moe.balanceOf(account)).to.be.closeTo(
        old_xp + 33n * UNIT,
        UNIT,
      );
      expect(await moe.balanceOf(sov.target)).to.closeTo(0, UNIT);
      expect(await sov.balanceOf(account)).to.closeTo(0, UNIT);
      // wait for +6 months: 2nd year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(50n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(50n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(297n * UNIT);
      // wait for +6 months: 2nd year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(67n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(67n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(280n * UNIT);
      // wait for +6 months: 3rd year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(85n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(85n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(262n * UNIT);
      // wait for +6 months: 3rd year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(102n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(102n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(245n * UNIT);
      // wait for +6 months: 4th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(119n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(119n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(228n * UNIT);
      // wait for +6 months: 4th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(136n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(136n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(211n * UNIT);
      // wait for +6 months: 5th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(154n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(154n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(193n * UNIT);
      // wait for +6 months: 5th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(171n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(171n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(176n * UNIT);
      // wait for +6 months: 6th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(188n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(188n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(159n * UNIT);
      // wait for +6 months: 6th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(206n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(206n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(141n * UNIT);
      // wait for +6 months: 7th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(223n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(223n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(124n * UNIT);
      // wait for +6 months: 7th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(241n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(241n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(106n * UNIT);
      // wait for +6 months: 8th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(259n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(259n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(88n * UNIT);
      // wait for +6 months: 8th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(276n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(276n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(71n * UNIT);
      // wait for +6 months: 9th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(294n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(294n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(53n * UNIT);
      // wait for +6 months: 9th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(311n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(311n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(36n * UNIT);
      // wait for +6 months: 10th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(330n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(330n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(17n * UNIT);
      // wait for +6 months: 10th year
      await network.provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(347n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(347n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(0);
      // wait for +12 months: 11th year (empty treasury)
      await network.provider.send("evm_increaseTime", [YEAR * 1.0]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      expect(await mty.rewardOf(account, nft_id)).to.eq(383n * UNIT);
      expect(await mty.claimed(account, nft_id)).to.eq(383n * UNIT);
      expect(await mty.claimable(account, nft_id)).to.eq(0);
      expect(await moe.balanceOf(mty.target)).to.eq(0);
      // APOW balance:
      expect(await sov.balanceOf(account)).to.closeTo(5_368_505n * UNIT, UNIT);
    });
  });
});
async function mintToken(amount) {
  const tx_mint = await moe.fake(addresses[0], amount);
  expect(tx_mint).to.be.an("object");
  const balance_0 = await moe.balanceOf(addresses[0]);
  expect(balance_0).to.be.gte(amount);
  const balance_1 = await moe.balanceOf(addresses[1]);
  expect(balance_1).to.eq(0);
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
  expect(nft_balance).to.eq(nft_balance_old - BigInt(amount));
  return [account, nft_id];
}
