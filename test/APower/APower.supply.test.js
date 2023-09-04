const { ethers, network } = require("hardhat");
const { expect } = require("chai");

const { pad } = require("../../source/functions");
const { nice_si } = require("../../source/functions");

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
    await mintToken(1_000n * UNIT);
    const supply = await moe.totalSupply();
    expect(supply).to.be.gte(1_000n * UNIT);
  });
  beforeEach(async function () {
    await increaseAllowanceBy(1000n * UNIT, nft.target);
  });
  it("should mint over 24 years (annually)", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    let prev;
    for (let i = 1; i <= 24; i++) {
      await network.provider.send("evm_increaseTime", [YEAR]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      const { claim_si, mint_si, rate_si, mint } = format({
        claim: await mty.claimed(account, nft_id),
        mint: await sov.balanceOf(account),
        prev,
      });
      console.log(pad(i, 2), claim_si, mint_si, rate_si + "%");
      prev = mint;
    }
  });
  it("should mint over 24 years (monthly)", async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    let prev;
    for (let i = 1; i <= 24 * 12; i++) {
      await network.provider.send("evm_increaseTime", [YEAR / 12]);
      expect(await mty.claim(account, nft_id)).to.be.an("object");
      if (i % 12) continue; // only print end-of-year data
      const { claim_si, mint_si, rate_si, mint } = format({
        claim: await mty.claimed(account, nft_id),
        mint: await sov.balanceOf(account),
        prev,
      });
      console.log(pad(i / 12, 2), claim_si, mint_si, rate_si + "%");
      prev = mint;
    }
  });
  function format({ claim, mint, prev }) {
    const rate = prev ? Number(mint) / Number(prev) - 1 : 9.999;
    const rate_si = pad(
      nice_si(rate * 100, {
        minPrecision: 1,
        maxPrecision: 1,
      }),
      5,
    );
    const claim_si = pad(
      nice_si(claim, {
        base: 1e18,
      }),
      3,
    );
    const mint_si = pad(
      nice_si(mint, {
        base: 1e18,
        minPrecision: 3,
      }),
      8,
    );
    return {
      claim,
      claim_si,
      mint,
      mint_si,
      rate,
      rate_si,
    };
  }
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
