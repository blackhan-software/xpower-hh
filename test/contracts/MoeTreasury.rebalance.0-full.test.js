/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let AOdin, XOdin; // contracts
let aodin, xodin; // instances
let Nft, Ppt, NftTreasury; // contracts
let nft, ppt, nft_treasury; // instances
let MoeTreasury; // contracts
let moe_treasury, mt; // instances
let UNIT; // decimals

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const NFT_ODIN_URL = "https://xpowermine.com/nfts/odin/{id}.json";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years
const APR = 1.25; // average percent

describe("MoeTreasury", async function () {
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
    AOdin = await ethers.getContractFactory("APowerOdin");
    expect(AOdin).to.exist;
    XOdin = await ethers.getContractFactory("XPowerOdinTest");
    expect(XOdin).to.exist;
  });
  beforeEach(async function () {
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.exist;
    Ppt = await ethers.getContractFactory("XPowerPpt");
    expect(Ppt).to.exist;
    NftTreasury = await ethers.getContractFactory("NftTreasury");
    expect(NftTreasury).to.exist;
    MoeTreasury = await ethers.getContractFactory("MoeTreasury");
    expect(MoeTreasury).to.exist;
  });
  beforeEach(async function () {
    xodin = await XOdin.deploy([], DEADLINE);
    expect(xodin).to.exist;
    await xodin.deployed();
    await xodin.init();
  });
  beforeEach(async function () {
    aodin = await AOdin.deploy(xodin.address, [], DEADLINE);
    expect(aodin).to.exist;
    await aodin.deployed();
  });
  beforeEach(async function () {
    const decimals = await xodin.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.be.true;
  });
  beforeEach(async function () {
    table = await new HashTable(xodin, addresses[0]).init({
      min_level: 3,
      max_level: 3,
      length: 1n,
    });
  });
  beforeEach(async function () {
    nft = await Nft.deploy(NFT_ODIN_URL, [xodin.address], [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
  });
  beforeEach(async function () {
    ppt = await Ppt.deploy(NFT_ODIN_URL, [], DEADLINE);
    expect(ppt).to.exist;
    await ppt.deployed();
  });
  beforeEach(async function () {
    nft_treasury = await NftTreasury.deploy(nft.address, ppt.address);
    expect(nft_treasury).to.exist;
    await nft_treasury.deployed();
  });
  beforeEach(async function () {
    moe_treasury = await MoeTreasury.deploy(
      [xodin.address],
      [aodin.address],
      ppt.address
    );
    expect(moe_treasury).to.exist;
    await moe_treasury.deployed();
    mt = moe_treasury;
  });
  beforeEach(async function () {
    await mt.grantRole(mt.APR_ROLE(), addresses[0]);
    await mt.setAPR(3202100, [0, 3, APR * 1_000_000]);
    await mt.setAPR(3202103, [0, 3, APR * 1_000_000]);
  });
  beforeEach(async function () {
    await aodin.transferOwnership(moe_treasury.address);
    expect(await aodin.owner()).to.eq(moe_treasury.address);
  });
  beforeEach(async function () {
    await ppt.transferOwnership(nft_treasury.address);
    expect(await ppt.owner()).to.eq(nft_treasury.address);
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
    const supply = await xodin.totalSupply();
    expect(supply).to.be.gte(4000n * UNIT);
  });
  beforeEach(async function () {
    await increaseAllowanceBy(4000n * UNIT, nft.address);
  });
  beforeEach(async function () {
    await xodin.transfer(moe_treasury.address, 110n * UNIT);
  });
  it("should full rebalance []", async function () {
    expect(await mt.rebalanceable(3)).to.eq(true);
    await mt.rebalance(3, true);
    expect(await mt.rebalanceable(3)).to.eq(false);
  });
  it("should full rebalance [1E0×UNITs]", async function () {
    const nft_unit = await stakeNft(await mintNft(0, 1), 1);
    expect(await mt.aprTargetOf(nft_unit)).to.eq(APR * 0);
    expect(await mt.rebalanceable(3)).to.eq(true);
    await mt.rebalance(3, true);
    expect(await mt.rebalanceable(3)).to.eq(false);
    expect(await mt.aprTargetOf(nft_unit)).to.eq(APR * 1_000_000);
  });
  it("should full rebalance [2E0×UNITs]", async function () {
    const nft_unit = await stakeNft(await mintNft(0, 2), 2);
    expect(await mt.aprTargetOf(nft_unit)).to.eq(APR * 0);
    expect(await mt.rebalanceable(3)).to.eq(true);
    await mt.rebalance(3, true);
    expect(await mt.rebalanceable(3)).to.eq(false);
    expect(await mt.aprTargetOf(nft_unit)).to.eq(APR * 1_000_000);
  });
  it("should full rebalance [1E3×UNITs]", async function () {
    const nft_unit = await stakeNft(await mintNft(0, 1e3), 1e3);
    expect(await mt.aprTargetOf(nft_unit)).to.eq(APR * 0);
    expect(await mt.rebalanceable(3)).to.eq(true);
    await mt.rebalance(3, true);
    expect(await mt.rebalanceable(3)).to.eq(false);
    await mt.rebalance(3, true);
    expect(await mt.rebalanceable(3)).to.eq(false);
    expect(await mt.aprTargetOf(nft_unit)).to.eq(APR * 1_000_000);
  });
  it("should full rebalance [2E3×UNITs]", async function () {
    const nft_unit = await stakeNft(await mintNft(0, 2e3), 2e3);
    expect(await mt.aprTargetOf(nft_unit)).to.eq(APR * 0);
    expect(await mt.rebalanceable(3)).to.eq(true);
    await mt.rebalance(3, true);
    expect(await mt.rebalanceable(3)).to.eq(false);
    await mt.rebalance(3, true);
    expect(await mt.rebalanceable(3)).to.eq(false);
    expect(await mt.aprTargetOf(nft_unit)).to.eq(APR * 1_000_000);
  });
  it("should full rebalance [1E0×UNITs,1E0×KILOs]", async function () {
    const nft_unit = await stakeNft(await mintNft(0, 1), 1);
    const nft_kilo = await stakeNft(await mintNft(3, 1), 1);
    expect(await mt.aprTargetOf(nft_unit)).to.eq(APR * 0);
    expect(await mt.aprTargetOf(nft_kilo)).to.eq(APR * 1_000_000);
    expect(await mt.rebalanceable(3)).to.eq(true);
    await mt.rebalance(3, true);
    expect(await mt.rebalanceable(3)).to.eq(false);
    expect(await mt.aprTargetOf(nft_unit)).to.eq(APR * 500_500_000);
    expect(await mt.aprTargetOf(nft_kilo)).to.eq(APR * 500_500);
  });
  it("should full rebalance [2E0×UNITs,2E0×KILOs]", async function () {
    const nft_unit = await stakeNft(await mintNft(0, 2), 2);
    const nft_kilo = await stakeNft(await mintNft(3, 2), 2);
    expect(await mt.aprTargetOf(nft_unit)).to.eq(APR * 0);
    expect(await mt.aprTargetOf(nft_kilo)).to.eq(APR * 1_000_000);
    expect(await mt.rebalanceable(3)).to.eq(true);
    await mt.rebalance(3, true);
    expect(await mt.rebalanceable(3)).to.eq(false);
    expect(await mt.aprTargetOf(nft_unit)).to.eq(APR * 500_500_000);
    expect(await mt.aprTargetOf(nft_kilo)).to.eq(APR * 500_500);
  });
  it("should full rebalance [1E3×UNITs,1E0×KILOs]", async function () {
    const nft_unit = await stakeNft(await mintNft(0, 1e3), 1e3);
    const nft_kilo = await stakeNft(await mintNft(3, 1), 1);
    expect(await mt.aprTargetOf(nft_unit)).to.eq(APR * 0);
    expect(await mt.aprTargetOf(nft_kilo)).to.eq(APR * 1_000_000);
    expect(await mt.rebalanceable(3)).to.eq(true);
    await mt.rebalance(3, true);
    expect(await mt.rebalanceable(3)).to.eq(false);
    await mt.rebalance(3, true);
    expect(await mt.rebalanceable(3)).to.eq(false);
    await mt.rebalance(3, true);
    expect(await mt.rebalanceable(3)).to.eq(false);
    expect(await mt.aprTargetOf(nft_unit)).to.eq(APR * 1_000_000);
    expect(await mt.aprTargetOf(nft_kilo)).to.eq(APR * 1_000_000);
  });
  it("should full rebalance [2E3×UNITs,2E0×KILOs]", async function () {
    const nft_unit1 = await stakeNft(await mintNft(0, 1e3), 1e3);
    expect(await mt.aprTargetOf(nft_unit1)).to.eq(APR * 0);
    expect(await mt.rebalanceable(3)).to.eq(true);
    await mt.rebalance(3, true);
    expect(await mt.rebalanceable(3)).to.eq(false);
    expect(await mt.aprTargetOf(nft_unit1)).to.eq(APR * 1_000_000);
    const nft_unit2 = await stakeNft(await mintNft(0, 1e3), 1e3);
    expect(await mt.aprTargetOf(nft_unit2)).to.eq(APR * 1_000_000);
    expect(await mt.rebalanceable(3)).to.eq(false); // same target!
    await mt.rebalance(3, true);
    expect(await mt.rebalanceable(3)).to.eq(false);
    expect(await mt.aprTargetOf(nft_unit2)).to.eq(APR * 1_000_000);
    const nft_kilo1 = await stakeNft(await mintNft(3, 1), 1);
    expect(await mt.aprTargetOf(nft_unit1)).to.eq(APR * 1_000_000);
    expect(await mt.aprTargetOf(nft_kilo1)).to.eq(APR * 1_000_000);
    expect(await mt.rebalanceable(3)).to.eq(true);
    await mt.rebalance(3, true);
    expect(await mt.rebalanceable(3)).to.eq(false);
    expect(await mt.aprTargetOf(nft_unit1)).to.eq(APR * 750_000);
    expect(await mt.aprTargetOf(nft_kilo1)).to.eq(APR * 1_500_000);
    const nft_kilo2 = await stakeNft(await mintNft(3, 1), 1);
    expect(await mt.aprTargetOf(nft_unit2)).to.eq(APR * 750_000);
    expect(await mt.aprTargetOf(nft_kilo2)).to.eq(APR * 1_500_000);
    expect(await mt.rebalanceable(3)).to.eq(true);
    await mt.rebalance(3, true);
    expect(await mt.rebalanceable(3)).to.eq(false);
    expect(await mt.aprTargetOf(nft_unit2)).to.eq(APR * 1_000_000);
    expect(await mt.aprTargetOf(nft_kilo2)).to.eq(APR * 1_000_000);
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
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(nft_balance.gt(0));
  return nft_id;
}
async function stakeNft(nft_id, amount) {
  const [account, address] = [addresses[0], nft_treasury.address];
  const tx_approval = await nft.setApprovalForAll(address, true);
  expect(tx_approval).to.be.an("object");
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
  return nft_id;
}
