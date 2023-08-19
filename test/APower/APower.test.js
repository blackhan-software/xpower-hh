const { ethers, network } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Sov, Nft, Ppt, Mty, Nty; // contracts
let moe, sov, nft, ppt, mty, nty; // instances
let UNIT; // decimals

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years
const DAYS = 86_400; // [seconds]

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
    moe = await Moe.deploy([], DEADLINE);
    expect(moe).to.be.an("object");
    await moe.init();
    sov = await Sov.deploy(moe.target, [], DEADLINE);
    expect(sov).to.be.an("object");
  });
  beforeEach(async function () {
    const decimals = await moe.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.eq(true);
  });
  beforeEach(async function () {
    nft = await Nft.deploy(moe.target, NFT_XPOW_URL, [], DEADLINE);
    expect(nft).to.be.an("object");
    ppt = await Ppt.deploy(NFT_XPOW_URL, [], DEADLINE);
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
    await mintToken(1140n * UNIT);
    const supply = await moe.totalSupply();
    expect(supply).to.be.gte(1140n * UNIT);
  });
  beforeEach(async function () {
    await increaseAllowanceBy(1000n * UNIT, nft.target);
  });
  beforeEach(async function () {
    await moe.transfer(mty.target, 110n * UNIT);
  });
  it("should mint after 1st year", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(10n * UNIT);
    expect(await mty.claimed(account, nft_id)).to.eq(10n * UNIT);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe.balanceOf(mty.target)).to.eq(100n * UNIT);
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(10n * UNIT);
    expect(await sov.balanceOf(account)).to.eq(10n * UNIT);
    expect(await sov.collateralization()).to.eq(1e6);
  });
  it("should mint after 1st year (pre-transferred)", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    expect(await moe.transfer(sov.target, 10n * UNIT)).to.be.an("object");
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(10n * UNIT);
    expect(await mty.claimed(account, nft_id)).to.eq(10n * UNIT);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe.balanceOf(mty.target)).to.eq(110n * UNIT);
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(10n * UNIT);
    expect(await sov.balanceOf(account)).to.eq(10n * UNIT);
    expect(await sov.collateralization()).to.eq(1e6);
  });
  it("should burn after 1st year", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(10n * UNIT);
    expect(await mty.claimed(account, nft_id)).to.eq(10n * UNIT);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe.balanceOf(mty.target)).to.eq(100n * UNIT);
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(10n * UNIT);
    expect(await sov.balanceOf(account)).to.eq(10n * UNIT);
    expect(await sov.collateralization()).to.eq(1e6);
    // burn balances of (aged) tokens:
    await burnToken(10n * UNIT);
  });
  it("should mint after 2nd year", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(10n * UNIT);
    expect(await sov.balanceOf(account)).to.eq(10n * UNIT);
    // wait for +12 months: 2nd year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(20n * UNIT);
    expect(await mty.claimed(account, nft_id)).to.eq(20n * UNIT);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe.balanceOf(mty.target)).to.eq(90n * UNIT);
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(20n * UNIT);
    expect(await sov.balanceOf(account)).to.eq(20n * UNIT);
    expect(await sov.collateralization()).to.eq(1e6);
  });
  it("should mint after 2nd year (pre-transferred)", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    expect(await moe.transfer(sov.target, 20n * UNIT)).to.be.an("object");
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(20n * UNIT);
    expect(await sov.balanceOf(account)).to.eq(10n * UNIT);
    // wait for +12 months: 2nd year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(20n * UNIT);
    expect(await mty.claimed(account, nft_id)).to.eq(20n * UNIT);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe.balanceOf(mty.target)).to.eq(110n * UNIT);
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(20n * UNIT);
    expect(await sov.balanceOf(account)).to.eq(20n * UNIT);
    expect(await sov.collateralization()).to.eq(1e6);
  });
  it("should burn after 2nd year", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(10n * UNIT);
    expect(await sov.balanceOf(account)).to.eq(10n * UNIT);
    // wait for +12 months: 2nd year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(20n * UNIT);
    expect(await mty.claimed(account, nft_id)).to.eq(20n * UNIT);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe.balanceOf(mty.target)).to.eq(90n * UNIT);
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(20n * UNIT);
    expect(await sov.balanceOf(account)).to.eq(20n * UNIT);
    expect(await sov.collateralization()).to.eq(1e6);
    // burn balances of (aged) tokens:
    await burnToken(20n * UNIT);
  });
  it("should mint after 3rd year", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(10n * UNIT);
    expect(await sov.balanceOf(account)).to.eq(10n * UNIT);
    // wait for +12 months: 2nd year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(20n * UNIT);
    expect(await sov.balanceOf(account)).to.eq(20n * UNIT);
    // wait for +12 months: 3rd year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(30n * UNIT);
    expect(await mty.claimed(account, nft_id)).to.eq(30n * UNIT);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe.balanceOf(mty.target)).to.eq(80n * UNIT);
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(30n * UNIT);
    expect(await sov.balanceOf(account)).to.eq(30n * UNIT);
    expect(await sov.collateralization()).to.eq(1e6);
  });
  it("should mint after 3rd year (pre-transferred)", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    expect(await moe.transfer(sov.target, 30n * UNIT)).to.be.an("object");
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(30n * UNIT);
    expect(await sov.balanceOf(account)).to.eq(10n * UNIT);
    // wait for +12 months: 2nd year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(30n * UNIT);
    expect(await sov.balanceOf(account)).to.eq(20n * UNIT);
    // wait for +12 months: 3rd year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(30n * UNIT);
    expect(await mty.claimed(account, nft_id)).to.eq(30n * UNIT);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe.balanceOf(mty.target)).to.eq(110n * UNIT);
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(30n * UNIT);
    expect(await sov.balanceOf(account)).to.eq(30n * UNIT);
    expect(await sov.collateralization()).to.eq(1e6);
  });
  it("should burn after 3rd year", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(10n * UNIT);
    expect(await sov.balanceOf(account)).to.eq(10n * UNIT);
    // wait for +12 months: 2nd year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(20n * UNIT);
    expect(await sov.balanceOf(account)).to.eq(20n * UNIT);
    // wait for +12 months: 3rd year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(30n * UNIT);
    expect(await mty.claimed(account, nft_id)).to.eq(30n * UNIT);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe.balanceOf(mty.target)).to.eq(80n * UNIT);
    // check balances of (aged) tokens:
    expect(await moe.balanceOf(sov.target)).to.eq(30n * UNIT);
    expect(await sov.balanceOf(account)).to.eq(30n * UNIT);
    expect(await sov.collateralization()).to.eq(1e6);
    // burn balances of (aged) tokens:
    await burnToken(30n * UNIT);
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
  expect(c_balance_old).to.be.gt(0);
  const x_balance_old = await moe.balanceOf(addresses[0]);
  expect(x_balance_old).to.be.gt(0);
  const a_balance_old = await sov.balanceOf(addresses[0]);
  expect(a_balance_old).to.be.gt(0);
  const tx_increase = await sov.increaseAllowance(addresses[0], amount);
  expect(tx_increase).to.be.an("object");
  const tx_burn = await sov.burnFrom(addresses[0], amount);
  expect(tx_burn).to.be.an("object");
  const c_balance_new = await moe.balanceOf(sov.target);
  expect(c_balance_new).to.eq(c_balance_old - BigInt(amount));
  const x_balance_new = await moe.balanceOf(addresses[0]);
  expect(x_balance_new).to.eq(x_balance_old + BigInt(amount));
  const a_balance_new = await sov.balanceOf(addresses[0]);
  expect(a_balance_new).to.eq(a_balance_old - BigInt(amount));
  const collateralization = await sov.collateralization();
  expect(collateralization).to.eq(0);
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