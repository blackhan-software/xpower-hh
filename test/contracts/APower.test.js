/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let APower, XPower; // contracts
let apower, xpower; // instances
let Nft, NftStaked, NftTreasury; // contracts
let nft, nft_staked, nft_treasury; // instances
let MoeTreasury; // contracts
let moe_treasury, mt; // instances
let UNUM; // decimals

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const NFT_ODIN_URL = "https://xpowermine.com/nfts/odin/{id}.json";
const NONE_ADDRESS = "0x0000000000000000000000000000000000000000";
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
    APower = await ethers.getContractFactory("APowerOdin");
    expect(APower).to.exist;
    XPower = await ethers.getContractFactory("XPowerOdinTest");
    expect(XPower).to.exist;
  });
  beforeEach(async function () {
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
    apower = await APower.deploy(NONE_ADDRESS, xpower.address, DEADLINE);
    expect(apower).to.exist;
    await apower.deployed();
  });
  beforeEach(async function () {
    table = await new HashTable(xpower, addresses[0]).init({
      length: 2n,
      min_level: 3,
      max_level: 3,
      use_cache: true,
    });
  });
  beforeEach(async function () {
    nft = await Nft.deploy(
      NONE_ADDRESS,
      xpower.address,
      NFT_ODIN_URL,
      DEADLINE
    );
    expect(nft).to.exist;
    await nft.deployed();
    nft_staked = await NftStaked.deploy(NONE_ADDRESS, NFT_ODIN_URL, DEADLINE);
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
        await mintToken(4095);
      } catch (ex) {
        break;
      }
    table.reset();
  });
  beforeEach(async function () {
    const supply = await xpower.totalSupply();
    expect(supply).to.be.gte(1601n * UNUM);
  });
  beforeEach(async function () {
    await increaseAllowanceBy(1000n * UNUM, nft.address);
  });
  beforeEach(async function () {
    await xpower.transfer(moe_treasury.address, 110n * UNUM);
  });
  it("should mint after 1st year", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1]);
    expect(await mt.claimFor(account, nft_id)).to.be.an("object");
    expect(await mt.rewardOf(account, nft_id)).to.eq(10n * UNUM);
    expect(await mt.claimedFor(account, nft_id)).to.eq(10n * UNUM);
    expect(await mt.claimableFor(account, nft_id)).to.eq(0);
    expect(await mt.balance()).to.eq(100n * UNUM);
    // check balances of aged tokens:
    expect(await xpower.balanceOf(apower.address)).to.eq(10n * UNUM);
    expect(await apower.balanceOf(account)).to.eq(10n * UNUM);
  });
  it("should mint after 2nd year", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mt.claimFor(account, nft_id)).to.be.an("object");
    // check balances of aged tokens:
    expect(await xpower.balanceOf(apower.address)).to.eq(10n * UNUM);
    expect(await apower.balanceOf(account)).to.eq(10n * UNUM);
    // wait for +12 months: 2nd year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mt.claimFor(account, nft_id)).to.be.an("object");
    expect(await mt.rewardOf(account, nft_id)).to.eq(20n * UNUM);
    expect(await mt.claimedFor(account, nft_id)).to.eq(20n * UNUM);
    expect(await mt.claimableFor(account, nft_id)).to.eq(0);
    expect(await mt.balance()).to.eq(90n * UNUM);
    // check balances of aged tokens:
    expect(await xpower.balanceOf(apower.address)).to.eq(20n * UNUM);
    expect(await apower.balanceOf(account)).to.eq(20n * UNUM);
  });
  it("should mint after 3rd year", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mt.claimFor(account, nft_id)).to.be.an("object");
    // check balances of aged tokens:
    expect(await xpower.balanceOf(apower.address)).to.eq(10n * UNUM);
    expect(await apower.balanceOf(account)).to.eq(10n * UNUM);
    // wait for +12 months: 2nd year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mt.claimFor(account, nft_id)).to.be.an("object");
    // check balances of aged tokens:
    expect(await xpower.balanceOf(apower.address)).to.eq(20n * UNUM);
    expect(await apower.balanceOf(account)).to.eq(20n * UNUM);
    // wait for +12 months: 3rd year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS]);
    expect(await mt.claimFor(account, nft_id)).to.be.an("object");
    expect(await mt.rewardOf(account, nft_id)).to.eq(30n * UNUM);
    expect(await mt.claimedFor(account, nft_id)).to.eq(30n * UNUM);
    expect(await mt.claimableFor(account, nft_id)).to.eq(0);
    expect(await mt.balance()).to.eq(80n * UNUM);
    // check balances of aged tokens:
    expect(await xpower.balanceOf(apower.address)).to.eq(30n * UNUM);
    expect(await apower.balanceOf(account)).to.eq(30n * UNUM);
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
