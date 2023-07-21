/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Sov, Mty, Nft, Ppt, Nty; // contracts
let moe, sov, mty, nft, ppt, nty; // instances
let UNIT; // decimals

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
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
    Moe = await ethers.getContractFactory("XPowerTest");
    expect(Moe).to.exist;
    Sov = await ethers.getContractFactory("APower");
    expect(Sov).to.exist;
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.exist;
    Ppt = await ethers.getContractFactory("XPowerPpt");
    expect(Ppt).to.exist;
    Mty = await ethers.getContractFactory("MoeTreasury");
    expect(Mty).to.exist;
    Nty = await ethers.getContractFactory("NftTreasury");
    expect(Nty).to.exist;
  });
  beforeEach(async function () {
    moe = await Moe.deploy([], DEADLINE);
    expect(moe).to.exist;
    await moe.deployed();
    await moe.init();
    sov = await Sov.deploy(moe.address, [], DEADLINE);
    expect(sov).to.exist;
    await sov.deployed();
  });
  beforeEach(async function () {
    nft = await Nft.deploy(moe.address, NFT_XPOW_URL, [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
    ppt = await Ppt.deploy(NFT_XPOW_URL, [], DEADLINE);
    expect(ppt).to.exist;
    await ppt.deployed();
  });
  beforeEach(async function () {
    mty = await Mty.deploy(moe.address, sov.address, ppt.address);
    expect(mty).to.exist;
    await mty.deployed();
    nty = await Nty.deploy(nft.address, ppt.address, mty.address);
    expect(nty).to.exist;
    await nty.deployed();
  });
  beforeEach(async function () {
    await mty.grantRole(mty.APR_ROLE(), addresses[0]);
    await mty.setAPR(202100, [0, 3, APR * 1_000_000]);
    await mty.setAPR(202103, [0, 3, APR * 1_000_000]);
  });
  beforeEach(async function () {
    await sov.transferOwnership(mty.address);
    expect(await sov.owner()).to.eq(mty.address);
    await ppt.transferOwnership(nty.address);
    expect(await ppt.owner()).to.eq(nty.address);
  });
  beforeEach(async function () {
    const decimals = await moe.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.be.true;
  });
  beforeEach(async function () {
    table = await new HashTable(moe, addresses[0]).init({
      use_cache: true,
      min_level: 4,
      max_level: 4,
      length: 275,
    });
    for (let i = 0; i < 275; i++) {
      await mintToken(15);
    }
    table.reset();
  });
  beforeEach(async function () {
    const supply = await moe.totalSupply();
    expect(supply).to.be.gte(4125n * UNIT);
  });
  beforeEach(async function () {
    await increaseAllowanceBy(4125n * UNIT, nft.address);
  });
  beforeEach(async function () {
    await moe.transfer(mty.address, 125n * UNIT);
  });
  it("should full refresh-rates []", async function () {
    expect(await mty.refreshable()).to.eq(true);
    await mty.refreshRates(true);
    expect(await mty.refreshable()).to.eq(false);
  });
  it("should full refresh-rates [1E0×UNITs]", async function () {
    const nft_unit = await mintNft(0, 1);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 0);
    expect(await mty.refreshable()).to.eq(true);
    await stakeNft(nft_unit, 1);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(true);
    await mty.refreshRates(true);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(false);
  });
  it("should full refresh-rates [2E0×UNITs]", async function () {
    const nft_unit = await mintNft(0, 2);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 0);
    expect(await mty.refreshable()).to.eq(true);
    await stakeNft(nft_unit, 2);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(true);
    await mty.refreshRates(true);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(false);
  });
  it("should full refresh-rates [1E3×UNITs]", async function () {
    const nft_unit = await mintNft(0, 1e3);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 0);
    expect(await mty.refreshable()).to.eq(true);
    await stakeNft(nft_unit, 1e3);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(true);
    await mty.refreshRates(true);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(false);
  });
  it("should full refresh-rates [2E3×UNITs]", async function () {
    const nft_unit = await mintNft(0, 2e3);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 0);
    expect(await mty.refreshable()).to.eq(true);
    await stakeNft(nft_unit, 2e3);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(true);
    await mty.refreshRates(true);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(false);
  });
  it("should full refresh-rates [1E0×UNITs,1E0×KILOs]", async function () {
    const nft_unit = await mintNft(0, 1);
    const nft_kilo = await mintNft(3, 1);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 0);
    expect(await mty.aprTargetOf(nft_kilo)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(true);
    await stakeNft(nft_unit, 1);
    await stakeNft(nft_kilo, 1);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 500_500_000);
    expect(await mty.aprTargetOf(nft_kilo)).to.eq(APR * 500_500);
    expect(await mty.refreshable()).to.eq(true);
    await mty.refreshRates(true);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 500_500_000);
    expect(await mty.aprTargetOf(nft_kilo)).to.eq(APR * 500_500);
    expect(await mty.refreshable()).to.eq(false);
  });
  it("should full refresh-rates [2E0×UNITs,2E0×KILOs]", async function () {
    const nft_unit = await mintNft(0, 2);
    const nft_kilo = await mintNft(3, 2);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 0);
    expect(await mty.aprTargetOf(nft_kilo)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(true);
    await stakeNft(nft_unit, 2);
    await stakeNft(nft_kilo, 2);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 500_500_000);
    expect(await mty.aprTargetOf(nft_kilo)).to.eq(APR * 500_500);
    expect(await mty.refreshable()).to.eq(true);
    await mty.refreshRates(true);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 500_500_000);
    expect(await mty.aprTargetOf(nft_kilo)).to.eq(APR * 500_500);
    expect(await mty.refreshable()).to.eq(false);
  });
  it("should full refresh-rates [1E3×UNITs,1E0×KILOs]", async function () {
    const nft_unit = await mintNft(0, 1e3);
    const nft_kilo = await mintNft(3, 1);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 0);
    expect(await mty.aprTargetOf(nft_kilo)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(true);
    await stakeNft(nft_unit, 1e3);
    await stakeNft(nft_kilo, 1);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 1_000_000);
    expect(await mty.aprTargetOf(nft_kilo)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(true);
    await mty.refreshRates(true);
    expect(await mty.aprTargetOf(nft_unit)).to.eq(APR * 1_000_000);
    expect(await mty.aprTargetOf(nft_kilo)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(false);
  });
  it("should full refresh-rates [2E3×UNITs,2E0×KILOs]", async function () {
    const nft_unit1 = await mintNft(0, 1e3);
    expect(await mty.aprTargetOf(nft_unit1)).to.eq(APR * 0);
    expect(await mty.refreshable()).to.eq(true);
    await stakeNft(nft_unit1, 1e3);
    expect(await mty.aprTargetOf(nft_unit1)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(true);
    await mty.refreshRates(true);
    expect(await mty.aprTargetOf(nft_unit1)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(false);
    const nft_unit2 = await mintNft(0, 1e3);
    expect(await mty.aprTargetOf(nft_unit2)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(false);
    await stakeNft(nft_unit2, 1e3);
    expect(await mty.aprTargetOf(nft_unit2)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(false);
    await mty.refreshRates(true);
    expect(await mty.aprTargetOf(nft_unit2)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(false);
    const nft_kilo1 = await mintNft(3, 1);
    expect(await mty.aprTargetOf(nft_unit1)).to.eq(APR * 1_000_000);
    expect(await mty.aprTargetOf(nft_kilo1)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(false);
    await stakeNft(nft_kilo1, 1);
    expect(await mty.aprTargetOf(nft_unit1)).to.eq(APR * 750_000);
    expect(await mty.aprTargetOf(nft_kilo1)).to.eq(APR * 1_500_000);
    expect(await mty.refreshable()).to.eq(false);
    await mty.refreshRates(true);
    expect(await mty.aprTargetOf(nft_unit1)).to.eq(APR * 750_000);
    expect(await mty.aprTargetOf(nft_kilo1)).to.eq(APR * 1_500_000);
    expect(await mty.refreshable()).to.eq(false);
    const nft_kilo2 = await mintNft(3, 1);
    expect(await mty.aprTargetOf(nft_unit2)).to.eq(APR * 750_000);
    expect(await mty.aprTargetOf(nft_kilo2)).to.eq(APR * 1_500_000);
    expect(await mty.refreshable()).to.eq(false);
    await stakeNft(nft_kilo2, 1);
    expect(await mty.aprTargetOf(nft_unit2)).to.eq(APR * 1_000_000);
    expect(await mty.aprTargetOf(nft_kilo2)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(false);
    await mty.refreshRates(true);
    expect(await mty.aprTargetOf(nft_unit2)).to.eq(APR * 1_000_000);
    expect(await mty.aprTargetOf(nft_kilo2)).to.eq(APR * 1_000_000);
    expect(await mty.refreshable()).to.eq(false);
  });
});
async function mintToken(amount) {
  const [nonce, block_hash] = table.nextNonce({ amount });
  expect(nonce).to.gte(0);
  const tx_cache = await moe.cache(block_hash);
  expect(tx_cache).to.be.an("object");
  const tx_mint = await moe.mint(addresses[0], block_hash, nonce);
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
  expect(nft_id.gt(0)).to.eq(true);
  const tx_mint = await nft.mint(addresses[0], level, amount);
  expect(tx_mint).to.be.an("object");
  const nft_balance = await nft.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(amount);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(nft_balance.gt(0));
  return nft_id;
}
async function stakeNft(nft_id, amount) {
  const [account, address] = [addresses[0], nty.address];
  const tx_approval = await nft.setApprovalForAll(address, true);
  expect(tx_approval).to.be.an("object");
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
  return nft_id;
}
