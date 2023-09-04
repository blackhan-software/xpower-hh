const { ethers, network } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Sov, Nft, Ppt, Mty, Nty; // contract
let moe, sov, nft, ppt, mty, nty; // instance
let UNIT; // decimals

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
const YEAR = 365.25 * 86_400; // [seconds]

describe("APower", async function () {
  beforeEach(async function () {
    await network.provider.send("hardhat_reset");
  });
  beforeEach(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
    addresses = accounts.map((acc) => acc.address);
    expect(addresses.length).to.be.greaterThan(1);
  });
  beforeEach(async function () {
    Moe = await ethers.getContractFactory("XPowerTest");
    expect(Moe).to.be.an("object");
    Sov = await ethers.getContractFactory("APower");
    expect(Sov).to.be.an("object");
  });
  beforeEach(async function () {
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.be.an("object");
    Ppt = await ethers.getContractFactory("XPowerPpt");
    expect(Ppt).to.be.an("object");
    Mty = await ethers.getContractFactory("MoeTreasury");
    expect(Mty).to.be.an("object");
    Nty = await ethers.getContractFactory("NftTreasury");
    expect(Nty).to.be.an("object");
  });
  beforeEach(async function () {
    moe = await Moe.deploy([], 0);
    expect(moe).to.be.an("object");
    await moe.init();
    sov = await Sov.deploy(moe.target, [], 0);
    expect(sov).to.be.an("object");
  });
  beforeEach(async function () {
    const decimals = await moe.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.eq(true);
  });
  beforeEach(async function () {
    nft = await Nft.deploy(moe.target, NFT_XPOW_URL, [], 0);
    expect(nft).to.be.an("object");
    ppt = await Ppt.deploy(NFT_XPOW_URL, [], 0);
    expect(ppt).to.be.an("object");
  });
  beforeEach(async function () {
    mty = await Mty.deploy(moe.target, sov.target, ppt.target);
    expect(mty).to.be.an("object");
    nty = await Nty.deploy(nft.target, ppt.target, mty.target);
    expect(nty).to.be.an("object");
  });
  beforeEach(async function () {
    await sov.transferOwnership(mty.target);
    expect(await sov.owner()).to.eq(mty.target);
  });
  beforeEach(async function () {
    await mintToken(1_602_199n * UNIT);
    const supply = await moe.totalSupply();
    expect(supply).to.be.gte(1_602_199n * UNIT);
  });
  beforeEach(async function () {
    await increaseAllowanceBy(1000n * UNIT, nft.target);
  });
  it("should mint after 1st year", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [YEAR]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(33n * UNIT);
    expect(await mty.claimed(account, nft_id)).to.eq(33n * UNIT);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe.balanceOf(mty.target)).to.eq(0);
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(0);
    expect(await sov.balanceOf(account)).to.closeTo(525_960n * UNIT, UNIT);
    expect(await sov.metric()).to.eq(0);
  });
  it("should mint after 1st year (pre-transferred)", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    expect(await moe.transfer(sov.target, 525_960n * UNIT)).to.be.an("object");
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [YEAR]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(33n * UNIT);
    expect(await mty.claimed(account, nft_id)).to.eq(33n * UNIT);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe.balanceOf(mty.target)).to.eq(0);
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(525_960n * UNIT);
    expect(await sov.balanceOf(account)).to.closeTo(525_960n * UNIT, UNIT);
    expect(await sov.metric()).to.closeTo(UNIT, UNIT / 1000n); // ~ 100%
  });
  it("should burn after 1st year", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [YEAR]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(33n * UNIT);
    expect(await mty.claimed(account, nft_id)).to.eq(33n * UNIT);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe.balanceOf(mty.target)).to.eq(0);
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(0);
    expect(await sov.balanceOf(account)).to.closeTo(525_960n * UNIT, UNIT);
    expect(await sov.metric()).to.eq(0);
    // burn balances of (aged) tokens:
    await burnToken(await sov.balanceOf(account));
  });
  it("should mint after 2nd year", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [YEAR]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(0);
    expect(await sov.balanceOf(account)).to.closeTo(525_960n * UNIT, UNIT);
    // wait for +12 months: 2nd year
    await network.provider.send("evm_increaseTime", [YEAR]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(67n * UNIT);
    expect(await mty.claimed(account, nft_id)).to.eq(67n * UNIT);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe.balanceOf(mty.target)).to.eq(0);
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(0);
    expect(await sov.balanceOf(account)).to.closeTo(1_059_770n * UNIT, UNIT);
    expect(await sov.metric()).to.eq(0);
  });
  it("should mint after 2nd year (pre-transferred)", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    expect(await moe.transfer(sov.target, 1_059_770n * UNIT)).to.be.an(
      "object",
    );
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [YEAR]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(1_059_770n * UNIT);
    expect(await sov.balanceOf(account)).to.closeTo(525_960n * UNIT, UNIT);
    // wait for +12 months: 2nd year
    await network.provider.send("evm_increaseTime", [YEAR]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(67n * UNIT);
    expect(await mty.claimed(account, nft_id)).to.eq(67n * UNIT);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe.balanceOf(mty.target)).to.eq(0);
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(1_059_770n * UNIT);
    expect(await sov.balanceOf(account)).to.closeTo(1_059_770n * UNIT, UNIT);
    expect(await sov.metric()).to.closeTo(UNIT, UNIT / 1000n); // ~ 100%
  });
  it("should burn after 2nd year", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [YEAR]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(0);
    expect(await sov.balanceOf(account)).to.closeTo(525_960n * UNIT, UNIT);
    // wait for +12 months: 2nd year
    await network.provider.send("evm_increaseTime", [YEAR]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(67n * UNIT);
    expect(await mty.claimed(account, nft_id)).to.eq(67n * UNIT);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe.balanceOf(mty.target)).to.eq(0);
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(0);
    expect(await sov.balanceOf(account)).to.closeTo(1_059_770n * UNIT, UNIT);
    expect(await sov.metric()).to.eq(0);
    // burn balances of (aged) tokens:
    await burnToken(await sov.balanceOf(account));
  });
  it("should mint after 3rd year", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [YEAR]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(0);
    expect(await sov.balanceOf(account)).to.closeTo(525_960n * UNIT, UNIT);
    // wait for +12 months: 2nd year
    await network.provider.send("evm_increaseTime", [YEAR]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(0);
    expect(await sov.balanceOf(account)).to.closeTo(1_059_770n * UNIT, UNIT);
    // wait for +12 months: 3rd year
    await network.provider.send("evm_increaseTime", [YEAR]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(102n * UNIT);
    expect(await mty.claimed(account, nft_id)).to.eq(102n * UNIT);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe.balanceOf(mty.target)).to.eq(0);
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(0);
    expect(await sov.balanceOf(account)).to.closeTo(1_601_199n * UNIT, UNIT);
    expect(await sov.metric()).to.eq(0);
  });
  it("should mint after 3rd year (pre-transferred)", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    expect(await moe.transfer(sov.target, 1_601_199n * UNIT)).to.be.an(
      "object",
    );
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [YEAR]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(1_601_199n * UNIT);
    expect(await sov.balanceOf(account)).to.closeTo(525_960n * UNIT, UNIT);
    // wait for +12 months: 2nd year
    await network.provider.send("evm_increaseTime", [YEAR]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(1_601_199n * UNIT);
    expect(await sov.balanceOf(account)).to.closeTo(1_059_770n * UNIT, UNIT);
    // wait for +12 months: 3rd year
    await network.provider.send("evm_increaseTime", [YEAR]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(102n * UNIT);
    expect(await mty.claimed(account, nft_id)).to.eq(102n * UNIT);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe.balanceOf(mty.target)).to.eq(0);
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(1_601_199n * UNIT);
    expect(await sov.balanceOf(account)).to.closeTo(1_601_199n * UNIT, UNIT);
    expect(await sov.metric()).to.closeTo(UNIT, UNIT / 1000n); // ~ 100%
  });
  it("should burn after 3rd year", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [YEAR]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(0);
    expect(await sov.balanceOf(account)).to.closeTo(525_960n * UNIT, UNIT);
    // wait for +12 months: 2nd year
    await network.provider.send("evm_increaseTime", [YEAR]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(0);
    expect(await sov.balanceOf(account)).to.closeTo(1_059_770n * UNIT, UNIT);
    // wait for +12 months: 3rd year
    await network.provider.send("evm_increaseTime", [YEAR]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(102n * UNIT);
    expect(await mty.claimed(account, nft_id)).to.eq(102n * UNIT);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe.balanceOf(mty.target)).to.eq(0);
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(0);
    expect(await sov.balanceOf(account)).to.closeTo(1_601_199n * UNIT, UNIT);
    expect(await sov.metric()).to.eq(0);
    // burn balances of (aged) tokens:
    await burnToken(await sov.balanceOf(account));
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
async function burnToken(amount) {
  const c_balance_old = await moe.balanceOf(sov.target);
  expect(c_balance_old).to.be.gte(0);
  const x_balance_old = await moe.balanceOf(addresses[0]);
  expect(x_balance_old).to.be.gte(0);
  const a_balance_old = await sov.balanceOf(addresses[0]);
  expect(a_balance_old).to.be.gte(0);
  const tx_increase = await sov.increaseAllowance(addresses[0], amount);
  expect(tx_increase).to.be.an("object");
  const tx_burn = await sov.burnFrom(addresses[0], amount);
  expect(tx_burn).to.be.an("object");
  const c_balance_new = await moe.balanceOf(sov.target);
  expect(c_balance_new).to.lte(c_balance_old);
  const x_balance_new = await moe.balanceOf(addresses[0]);
  expect(x_balance_new).to.gte(x_balance_old);
  const a_balance_new = await sov.balanceOf(addresses[0]);
  expect(a_balance_new).to.eq(a_balance_old - BigInt(amount));
  const metric = await sov.metric();
  expect(metric).to.eq(0);
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
