const { ethers } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Sov, Nft, Ppt, Mty, Nty; // contracts
let moe, sov, nft, ppt, mty, nty; // instances
let UNIT; // decimals

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years

describe("NftTreasury", async function () {
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
  beforeEach(async function () {
    moe = await Moe.deploy([], DEADLINE);
    expect(moe).to.be.an("object");
    await moe.init();
    sov = await Sov.deploy(moe.target, [], DEADLINE);
    expect(sov).to.be.an("object");
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
    const decimals = await moe.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.eq(true);
  });
  beforeEach(async function () {
    await mintToken(1n * UNIT);
    await increaseAllowanceBy(UNIT, nft.target);
  });
  describe("stake", async function () {
    it("should stake nft for amount=1", async function () {
      const [owner, address] = [addresses[0], nty.target];
      const nft_id = await mintNft(0, 1);
      expect(nft_id).to.be.gt(0);
      const tx_approval = await await nft.setApprovalForAll(address, true);
      expect(tx_approval).to.be.an("object");
      const tx_transfer = await ppt.transferOwnership(address);
      expect(tx_transfer).to.be.an("object");
      const tx_stake = await nty.stake(owner, nft_id, 1);
      expect(tx_stake).to.be.an("object");
      const nft_staked_balance = await ppt.balanceOf(owner, nft_id);
      expect(nft_staked_balance).to.eq(1);
      const nft_treasury_balance = await nft.balanceOf(address, nft_id);
      expect(nft_treasury_balance).to.eq(1);
      const nft_balance = await nft.balanceOf(owner, nft_id);
      expect(nft_balance).to.eq(0);
    });
    it("should *not* stake nft for amount=1 (not approved)", async function () {
      const [owner, address] = [addresses[0], nty.target];
      const nft_id = await mintNft(0, 1);
      expect(nft_id).to.be.gt(0);
      const tx_transfer = await ppt.transferOwnership(address);
      expect(tx_transfer).to.be.an("object");
      const tx_stake = await nty.stake(owner, nft_id, 1).catch((ex) => {
        const m = ex.message.match(/caller is not token owner or approved/);
        if (m === null) console.debug(ex);
        expect(m).to.not.eq(null);
      });
      expect(tx_stake).to.eq(undefined);
    });
    it("should *not* stake nft for amount=1 (not owner)", async function () {
      const [owner, address] = [addresses[0], nty.target];
      const nft_id = await mintNft(0, 1);
      expect(nft_id).to.be.gt(0);
      const tx_approval = await await nft.setApprovalForAll(address, true);
      expect(tx_approval).to.be.an("object");
      const tx_stake = await nty.stake(owner, nft_id, 1).catch((ex) => {
        const m = ex.message.match(/caller is not the owner/);
        if (m === null) console.debug(ex);
        expect(m).to.not.eq(null);
      });
      expect(tx_stake).to.eq(undefined);
    });
  });
  describe("stake-batch", async function () {
    it("should stake-batch nft(s) for amount=1", async function () {
      const [owner, address] = [addresses[0], nty.target];
      const nft_id = await mintNft(0, 1);
      expect(nft_id).to.be.gt(0);
      const tx_approval = await await nft.setApprovalForAll(address, true);
      expect(tx_approval).to.be.an("object");
      const tx_transfer = await ppt.transferOwnership(address);
      expect(tx_transfer).to.be.an("object");
      const tx_stake = await nty.stakeBatch(owner, [nft_id], [1]);
      expect(tx_stake).to.be.an("object");
      const nft_staked_balance = await ppt.balanceOf(owner, nft_id);
      expect(nft_staked_balance).to.eq(1);
      const nft_treasury_balance = await nft.balanceOf(address, nft_id);
      expect(nft_treasury_balance).to.eq(1);
      const nft_balance = await nft.balanceOf(owner, nft_id);
      expect(nft_balance).to.eq(0);
    });
    it("should *not* stake-batch nft(s) for amount=1 (not approved)", async function () {
      const [owner, address] = [addresses[0], nty.target];
      const nft_id = await mintNft(0, 1);
      expect(nft_id).to.be.gt(0);
      const tx_transfer = await ppt.transferOwnership(address);
      expect(tx_transfer).to.be.an("object");
      const tx_stake = await nty
        .stakeBatch(owner, [nft_id], [1])
        .catch((ex) => {
          const m = ex.message.match(/caller is not token owner or approved/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        });
      expect(tx_stake).to.eq(undefined);
    });
    it("should *not* stake-batch nft(s) for amount=1 (not owner)", async function () {
      const [owner, address] = [addresses[0], nty.target];
      const nft_id = await mintNft(0, 1);
      expect(nft_id).to.be.gt(0);
      const tx_approval = await await nft.setApprovalForAll(address, true);
      expect(tx_approval).to.be.an("object");
      const tx_stake = await nty
        .stakeBatch(owner, [nft_id], [1])
        .catch((ex) => {
          const m = ex.message.match(/caller is not the owner/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        });
      expect(tx_stake).to.eq(undefined);
    });
  });
  describe("unstake", async function () {
    it("should unstake nft for amount=1", async function () {
      const [owner, address] = [addresses[0], nty.target];
      const nft_id = await mintNft(0, 1);
      expect(nft_id).to.be.gt(0);
      const tx_approval = await await nft.setApprovalForAll(address, true);
      expect(tx_approval).to.be.an("object");
      const tx_transfer = await ppt.transferOwnership(address);
      expect(tx_transfer).to.be.an("object");
      const tx_stake = await nty.stake(owner, nft_id, 1);
      expect(tx_stake).to.be.an("object");
      const tx_unstake = await nty.unstake(owner, nft_id, 1);
      expect(tx_unstake).to.be.an("object");
      const nft_staked_balance = await ppt.balanceOf(owner, nft_id);
      expect(nft_staked_balance).to.eq(0);
      const nft_treasury_balance = await nft.balanceOf(address, nft_id);
      expect(nft_treasury_balance).to.eq(0);
      const nft_balance = await nft.balanceOf(owner, nft_id);
      expect(nft_balance).to.eq(1);
    });
  });
  describe("unstake-batch", async function () {
    it("should unstake-batch nft(s) for amount=1", async function () {
      const [owner, address] = [addresses[0], nty.target];
      const nft_id = await mintNft(0, 1); // UNIT NFT
      expect(nft_id).to.be.gt(0);
      const tx_approval = await await nft.setApprovalForAll(address, true);
      expect(tx_approval).to.be.an("object");
      const tx_transfer = await ppt.transferOwnership(address);
      expect(tx_transfer).to.be.an("object");
      const tx_stake = await nty.stakeBatch(owner, [nft_id], [1]);
      expect(tx_stake).to.be.an("object");
      const tx_unstake = await nty.unstakeBatch(owner, [nft_id], [1]);
      expect(tx_unstake).to.be.an("object");
      const nft_staked_balance = await ppt.balanceOf(owner, nft_id);
      expect(nft_staked_balance).to.eq(0);
      const nft_treasury_balance = await nft.balanceOf(address, nft_id);
      expect(nft_treasury_balance).to.eq(0);
      const nft_balance = await nft.balanceOf(owner, nft_id);
      expect(nft_balance).to.eq(1);
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
  expect(allowance).to.be.gte(amount);
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
