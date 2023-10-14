const { ethers, network } = require("hardhat");
const { expect } = require("chai");

const { pad } = require("../../source/functions");
const { nice_si } = require("../../source/functions");

let accounts; // all accounts
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
    sov = await Sov.deploy(moe, [], 0);
    expect(sov).to.be.an("object");
  });
  beforeEach(async function () {
    const decimals = await moe.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.eq(true);
  });
  beforeEach(async function () {
    nft = await Nft.deploy(moe, NFT_XPOW_URL, [], 0);
    expect(nft).to.be.an("object");
    ppt = await Ppt.deploy(NFT_XPOW_URL, [], 0);
    expect(ppt).to.be.an("object");
  });
  beforeEach(async function () {
    mty = await Mty.deploy(moe, sov, ppt);
    expect(mty).to.be.an("object");
    nty = await Nty.deploy(nft, ppt, mty);
    expect(nty).to.be.an("object");
  });
  beforeEach(async function () {
    await sov.transferOwnership(mty);
    expect(await sov.owner()).to.eq(mty.target);
  });
  beforeEach(async function () {
    await mintToken(1_000_000n * UNIT);
    const supply = await moe.totalSupply();
    expect(supply).to.be.gte(1_000_000n * UNIT);
  });
  beforeEach(async function () {
    await increaseAllowanceBy(1_000_000n * UNIT, nft);
  });
  beforeEach(async function () {
    const tx_approval = await nft.setApprovalForAll(nty, true);
    expect(tx_approval).to.be.an("object");
    const tx_transfer = await ppt.transferOwnership(nty);
    expect(tx_transfer).to.be.an("object");
  });
  //
  // 1 UNIT, 0 KILO NFTs:
  //
  it("should mint over 24 years (annualy: [1U,0K] NFTs)", async function () {
    const unit_id = await stakeNft(await mintNft(0, 1), 1);
    let prev;
    for (let i = 1; i <= 24; i++) {
      await network.provider.send("evm_increaseTime", [YEAR]);
      expect(await mty.claim(accounts[0], unit_id)).to.be.an("object");
      const { claim_si, mint_si, rate_si, mint } = format({
        claim: await mty.claimed(accounts[0], unit_id),
        mint: await sov.balanceOf(accounts[0]),
        prev,
      });
      console.log(pad(i, 2), claim_si, mint_si, rate_si + "%");
      prev = mint;
    }
  }).timeout(900_000);
  it("should mint over 24 years (monthly: [1U,0K] NFTs)", async function () {
    const unit_id = await stakeNft(await mintNft(0, 1), 1);
    let prev;
    for (let i = 1; i <= 24 * 12; i++) {
      await network.provider.send("evm_increaseTime", [YEAR / 12]);
      expect(await mty.claim(accounts[0], unit_id)).to.be.an("object");
      if (i % 12) continue; // only print end-of-year data
      const { claim_si, mint_si, rate_si, mint } = format({
        claim: await mty.claimed(accounts[0], unit_id),
        mint: await sov.balanceOf(accounts[0]),
        prev,
      });
      console.log(pad(i / 12, 2), claim_si, mint_si, rate_si + "%");
      prev = mint;
    }
  }).timeout(900_000);
  //
  // 0 UNIT, 1 KILO NFTs:
  //
  it("should mint over 24 years (annualy: [0U,1K] NFTs)", async function () {
    const kilo_id = await stakeNft(await mintNft(3, 1), 1);
    let prev;
    for (let i = 1; i <= 24; i++) {
      await network.provider.send("evm_increaseTime", [YEAR]);
      expect(await mty.claim(accounts[0], kilo_id)).to.be.an("object");
      const { claim_si, mint_si, rate_si, mint } = format({
        claim: await mty.claimed(accounts[0], kilo_id),
        mint: await sov.balanceOf(accounts[0]),
        prev,
      });
      console.log(pad(i, 2), claim_si, mint_si, rate_si + "%");
      prev = mint;
    }
  }).timeout(900_000);
  it("should mint over 24 years (monthly: [0U,1K] NFTs)", async function () {
    const kilo_id = await stakeNft(await mintNft(3, 1), 1);
    let prev;
    for (let i = 1; i <= 24 * 12; i++) {
      await network.provider.send("evm_increaseTime", [YEAR / 12]);
      expect(await mty.claim(accounts[0], kilo_id)).to.be.an("object");
      if (i % 12) continue; // only print end-of-year data
      const { claim_si, mint_si, rate_si, mint } = format({
        claim: await mty.claimed(accounts[0], kilo_id),
        mint: await sov.balanceOf(accounts[0]),
        prev,
      });
      console.log(pad(i / 12, 2), claim_si, mint_si, rate_si + "%");
      prev = mint;
    }
  }).timeout(900_000);
  //
  // 1 UNIT, 1 KILO NFTs:
  //
  it("should mint over 24 years (annualy: [1U,1K] NFTs)", async function () {
    const unit_id = await stakeNft(await mintNft(0, 1), 1);
    const kilo_id = await stakeNft(await mintNft(3, 1), 1);
    let prev;
    for (let i = 1; i <= 24; i++) {
      await network.provider.send("evm_increaseTime", [YEAR]);
      expect(await mty.claim(accounts[0], unit_id)).to.be.an("object");
      expect(await mty.claim(accounts[0], kilo_id)).to.be.an("object");
      const { claim_si, mint_si, rate_si, mint } = format({
        claim: [
          await mty.claimed(accounts[0], unit_id),
          await mty.claimed(accounts[0], kilo_id),
        ].reduce((a, b) => a + b, 0n),
        mint: await sov.balanceOf(accounts[0]),
        prev,
      });
      console.log(pad(i, 2), claim_si, mint_si, rate_si + "%");
      prev = mint;
    }
  }).timeout(900_000);
  it("should mint over 24 years (monthly: [1U,1K] NFTs)", async function () {
    const unit_id = await stakeNft(await mintNft(0, 1), 1);
    const kilo_id = await stakeNft(await mintNft(3, 1), 1);
    let prev;
    for (let i = 1; i <= 24 * 12; i++) {
      await network.provider.send("evm_increaseTime", [YEAR / 12]);
      expect(await mty.claim(accounts[0], unit_id)).to.be.an("object");
      expect(await mty.claim(accounts[0], kilo_id)).to.be.an("object");
      if (i % 12) continue; // only print end-of-year data
      const { claim_si, mint_si, rate_si, mint } = format({
        claim: [
          await mty.claimed(accounts[0], unit_id),
          await mty.claimed(accounts[0], kilo_id),
        ].reduce((a, b) => a + b, 0n),
        mint: await sov.balanceOf(accounts[0]),
        prev,
      });
      console.log(pad(i / 12, 2), claim_si, mint_si, rate_si + "%");
      prev = mint;
    }
  }).timeout(900_000);
  //
  // 2 UNIT, 2 KILO NFTs:
  //
  it("should mint over 24 years (annualy: [2U,2K] NFTs)", async function () {
    const unit_id = await stakeNft(await mintNft(0, 2), 2);
    const kilo_id = await stakeNft(await mintNft(3, 2), 2);
    let prev;
    for (let i = 1; i <= 24; i++) {
      await network.provider.send("evm_increaseTime", [YEAR]);
      expect(await mty.claim(accounts[0], unit_id)).to.be.an("object");
      expect(await mty.claim(accounts[0], kilo_id)).to.be.an("object");
      const { claim_si, mint_si, rate_si, mint } = format({
        claim: [
          await mty.claimed(accounts[0], unit_id),
          await mty.claimed(accounts[0], kilo_id),
        ].reduce((a, b) => a + b, 0n),
        mint: await sov.balanceOf(accounts[0]),
        prev,
      });
      console.log(pad(i, 2), claim_si, mint_si, rate_si + "%");
      prev = mint;
    }
  }).timeout(900_000);
  it("should mint over 24 years (monthly: [2U,2K] NFTs)", async function () {
    const unit_id = await stakeNft(await mintNft(0, 2), 2);
    const kilo_id = await stakeNft(await mintNft(3, 2), 2);
    let prev;
    for (let i = 1; i <= 24 * 12; i++) {
      await network.provider.send("evm_increaseTime", [YEAR / 12]);
      expect(await mty.claim(accounts[0], unit_id)).to.be.an("object");
      expect(await mty.claim(accounts[0], kilo_id)).to.be.an("object");
      if (i % 12) continue; // only print end-of-year data
      const { claim_si, mint_si, rate_si, mint } = format({
        claim: [
          await mty.claimed(accounts[0], unit_id),
          await mty.claimed(accounts[0], kilo_id),
        ].reduce((a, b) => a + b, 0n),
        mint: await sov.balanceOf(accounts[0]),
        prev,
      });
      console.log(pad(i / 12, 2), claim_si, mint_si, rate_si + "%");
      prev = mint;
    }
  }).timeout(900_000);
  //
  // Σ UNIT, Σ KILO NFTs:
  //
  it("should mint over 24 years (annualy: [ΣU,ΣK] NFTs)", async function () {
    let prev;
    for (let i = 1; i <= 24; i++) {
      const unit_id = await stakeNft(await mintNft(0, 1), 1);
      const kilo_id = await stakeNft(await mintNft(3, 1), 1);
      await network.provider.send("evm_increaseTime", [YEAR]);
      expect(await mty.claim(accounts[0], unit_id)).to.be.an("object");
      expect(await mty.claim(accounts[0], kilo_id)).to.be.an("object");
      const { claim_si, mint_si, rate_si, mint } = format({
        claim: [
          await mty.claimed(accounts[0], unit_id),
          await mty.claimed(accounts[0], kilo_id),
        ].reduce((a, b) => a + b, 0n),
        mint: await sov.balanceOf(accounts[0]),
        prev,
      });
      console.log(pad(i, 2), claim_si, mint_si, rate_si + "%");
      prev = mint;
    }
  }).timeout(900_000);
  it("should mint over 24 years (monthly: [ΣU,ΣK] NFTs)", async function () {
    let prev;
    for (let i = 1; i <= 24 * 12; i++) {
      const unit_id = await stakeNft(await mintNft(0, 1), 1);
      const kilo_id = await stakeNft(await mintNft(3, 1), 1);
      await network.provider.send("evm_increaseTime", [YEAR / 12]);
      expect(await mty.claim(accounts[0], unit_id)).to.be.an("object");
      expect(await mty.claim(accounts[0], kilo_id)).to.be.an("object");
      if (i % 12) continue; // only print end-of-year data
      const { claim_si, mint_si, rate_si, mint } = format({
        claim: [
          await mty.claimed(accounts[0], unit_id),
          await mty.claimed(accounts[0], kilo_id),
        ].reduce((a, b) => a + b, 0n),
        mint: await sov.balanceOf(accounts[0]),
        prev,
      });
      console.log(pad(i / 12, 2), claim_si, mint_si, rate_si + "%");
      prev = mint;
    }
  }).timeout(900_000);
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
      minPrecision: 2,
      maxPrecision: 2,
    }),
    6,
  );
  const mint_si = pad(
    nice_si(mint, {
      base: 1e18,
      minPrecision: 3,
      maxPrecision: 3,
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
async function mintToken(amount) {
  const tx_mint = await moe.fake(accounts[0], amount);
  expect(tx_mint).to.be.an("object");
  const balance_0 = await moe.balanceOf(accounts[0]);
  expect(balance_0).to.be.gte(amount);
  const balance_1 = await moe.balanceOf(accounts[1]);
  expect(balance_1).to.eq(0);
}
async function increaseAllowanceBy(amount, spender) {
  const tx_increase = await moe.increaseAllowance(spender, amount);
  expect(tx_increase).to.be.an("object");
  const allowance = await moe.allowance(accounts[0], spender);
  expect(allowance).to.gte(amount);
}
async function mintNft(level, amount) {
  const nft_id = await nft.idBy(await nft.year(), level);
  expect(nft_id).to.be.gt(0);
  const tx_mint = await nft.mint(accounts[0], level, amount);
  expect(tx_mint).to.be.an("object");
  return nft_id;
}
async function stakeNft(nft_id, amount) {
  const nft_balance_old = await nft.balanceOf(accounts[0], nft_id);
  expect(nft_balance_old).to.gte(amount);
  const tx_stake = await nty.stake(accounts[0], nft_id, amount);
  expect(tx_stake).to.be.an("object");
  return nft_id;
}
