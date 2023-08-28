const { ethers } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Sov, Nft, Ppt, Mty, Nty; // contract
let moe, sov, nft, ppt, mty, nty; // instance
let UNIT; // decimals

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";

describe("MoeTreasury", async function () {
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
    await mty.grantRole(mty.APR_ROLE(), addresses[0]);
    await mty.setAPR(202100, [0, 3, mul(1e6), 256]);
    await mty.setAPR(202103, [0, 3, mul(1e6), 256]);
  });
  beforeEach(async function () {
    await sov.transferOwnership(mty.target);
    expect(await sov.owner()).to.eq(mty.target);
    await ppt.transferOwnership(nty.target);
    expect(await ppt.owner()).to.eq(nty.target);
  });
  beforeEach(async function () {
    const decimals = await moe.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.eq(true);
  });
  beforeEach(async function () {
    await mintToken(4125n * UNIT);
  });
  beforeEach(async function () {
    const supply = await moe.totalSupply();
    expect(supply).to.be.gte(4125n * UNIT);
  });
  beforeEach(async function () {
    await increaseAllowanceBy(4125n * UNIT, nft.target);
  });
  beforeEach(async function () {
    await moe.transfer(mty.target, 125n * UNIT);
  });
  it("should fast refresh-rates []", async function () {
    await mty.refreshRates(false);
  });
  it("should fast refresh-rates [1E0×UNITs]", async function () {
    const nft_unit = await mintNft(0, 1);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(0x0), 1);
    await stakeNft(nft_unit, 1);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(1e6), 1);
    await mty.refreshRates(false);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(1e6), 1);
  });
  it("should fast refresh-rates [2E0×UNITs]", async function () {
    const nft_unit = await mintNft(0, 2);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(0x0), 1);
    await stakeNft(nft_unit, 2);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(1e6), 1);
    await mty.refreshRates(false);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(1e6), 1);
  });
  it("should fast refresh-rates [1E3×UNITs]", async function () {
    const nft_unit = await mintNft(0, 1e3);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(0x0), 1);
    await stakeNft(nft_unit, 1e3);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(1e6), 1);
    await mty.refreshRates(false);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(1e6), 1);
  });
  it("should fast refresh-rates [2E3×UNITs]", async function () {
    const nft_unit = await mintNft(0, 2e3);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(0x0), 1);
    await stakeNft(nft_unit, 2e3);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(1e6), 1);
    await mty.refreshRates(false);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(1e6), 1);
  });
  it("should fast refresh-rates [1E0×UNITs,1E0×KILOs]", async function () {
    const nft_unit = await mintNft(0, 1);
    const nft_kilo = await mintNft(3, 1);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(0x0), 1);
    expect(await mty.aprTargetOf(nft_kilo)).to.be.closeTo(mul(1e6), 1);
    await stakeNft(nft_unit, 1);
    await stakeNft(nft_kilo, 1);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(0.5005e9), 1);
    expect(await mty.aprTargetOf(nft_kilo)).to.be.closeTo(mul(0.5005e6), 1);
    await mty.refreshRates(false);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(0.5005e9), 1);
    expect(await mty.aprTargetOf(nft_kilo)).to.be.closeTo(mul(0.5005e6), 1);
  });
  it("should fast refresh-rates [2E0×UNITs,2E0×KILOs]", async function () {
    const nft_unit = await mintNft(0, 2);
    const nft_kilo = await mintNft(3, 2);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(0x0), 1);
    expect(await mty.aprTargetOf(nft_kilo)).to.be.closeTo(mul(1e6), 1);
    await stakeNft(nft_unit, 2);
    await stakeNft(nft_kilo, 2);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(0.5005e9), 1);
    expect(await mty.aprTargetOf(nft_kilo)).to.be.closeTo(mul(0.5005e6), 1);
    await mty.refreshRates(false);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(0.5005e9), 1);
    expect(await mty.aprTargetOf(nft_kilo)).to.be.closeTo(mul(0.5005e6), 1);
  });
  it("should fast refresh-rates [1E3×UNITs,1E0×KILOs]", async function () {
    const nft_unit = await mintNft(0, 1e3);
    const nft_kilo = await mintNft(3, 1);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(0x0), 1);
    expect(await mty.aprTargetOf(nft_kilo)).to.be.closeTo(mul(1e6), 1);
    await stakeNft(nft_unit, 1e3);
    await stakeNft(nft_kilo, 1);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(1e6), 1);
    expect(await mty.aprTargetOf(nft_kilo)).to.be.closeTo(mul(1e6), 1);
    await mty.refreshRates(false);
    expect(await mty.aprTargetOf(nft_unit)).to.be.closeTo(mul(1e6), 1);
    expect(await mty.aprTargetOf(nft_kilo)).to.be.closeTo(mul(1e6), 1);
  });
  it("should fast refresh-rates [2E3×UNITs,2E0×KILOs]", async function () {
    const nft_unit1 = await mintNft(0, 1e3);
    expect(await mty.aprTargetOf(nft_unit1)).to.be.closeTo(mul(0x0), 1);
    await stakeNft(nft_unit1, 1e3);
    expect(await mty.aprTargetOf(nft_unit1)).to.be.closeTo(mul(1e6), 1);
    await mty.refreshRates(false);
    expect(await mty.aprTargetOf(nft_unit1)).to.be.closeTo(mul(1e6), 1);
    const nft_unit2 = await mintNft(0, 1e3);
    expect(await mty.aprTargetOf(nft_unit2)).to.be.closeTo(mul(1e6), 1);
    await stakeNft(nft_unit2, 1e3);
    expect(await mty.aprTargetOf(nft_unit2)).to.be.closeTo(mul(1e6), 1);
    await mty.refreshRates(false);
    expect(await mty.aprTargetOf(nft_unit2)).to.be.closeTo(mul(1e6), 1);
    const nft_kilo1 = await mintNft(3, 1);
    expect(await mty.aprTargetOf(nft_unit1)).to.be.closeTo(mul(1e6), 1);
    expect(await mty.aprTargetOf(nft_kilo1)).to.be.closeTo(mul(1e6), 1);
    await stakeNft(nft_kilo1, 1);
    expect(await mty.aprTargetOf(nft_unit1)).to.be.closeTo(mul(0.75e6), 1);
    expect(await mty.aprTargetOf(nft_kilo1)).to.be.closeTo(mul(1.5e6), 1);
    await mty.refreshRates(false);
    expect(await mty.aprTargetOf(nft_unit1)).to.be.closeTo(mul(0.75e6), 1);
    expect(await mty.aprTargetOf(nft_kilo1)).to.be.closeTo(mul(1.5e6), 1);
    const nft_kilo2 = await mintNft(3, 1);
    expect(await mty.aprTargetOf(nft_unit2)).to.be.closeTo(mul(0.75e6), 1);
    expect(await mty.aprTargetOf(nft_kilo2)).to.be.closeTo(mul(1.5e6), 1);
    await stakeNft(nft_kilo2, 1);
    expect(await mty.aprTargetOf(nft_unit2)).to.be.closeTo(mul(1e6), 1);
    expect(await mty.aprTargetOf(nft_kilo2)).to.be.closeTo(mul(1e6), 1);
    await mty.refreshRates(false);
    expect(await mty.aprTargetOf(nft_unit2)).to.be.closeTo(mul(1e6), 1);
    expect(await mty.aprTargetOf(nft_kilo2)).to.be.closeTo(mul(1e6), 1);
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
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(nft_balance > 0);
  return nft_id;
}
async function stakeNft(nft_id, amount) {
  const [account, address] = [addresses[0], nty.target];
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
  expect(nft_balance).to.eq(nft_balance_old - BigInt(amount));
  return nft_id;
}
function mul(n, ARR = 3.375) {
  return Math.round(ARR * n);
}
