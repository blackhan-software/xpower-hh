/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower, Nft, NftStaked, NftTreasury; // contracts
let xpower, nft, nft_staked, nft_treasury; // instances

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const NFT_LOKI_URL = "https://xpowermine.com/nfts/loki/{id}.json";
const NONE_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years

describe("NftTreasury", async function () {
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
    const factory = await ethers.getContractFactory("XPowerLokiTest");
    const contract = await factory.deploy(NONE_ADDRESS, DEADLINE);
    table = await new HashTable(contract, addresses[0]).init();
  });
  before(async function () {
    XPower = await ethers.getContractFactory("XPowerLokiTest");
    expect(XPower).to.exist;
  });
  beforeEach(async function () {
    xpower = await XPower.deploy(NONE_ADDRESS, DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
    await xpower.init();
  });
  before(async function () {
    Nft = await ethers.getContractFactory("XPowerLokiNft");
    expect(Nft).to.exist;
    NftStaked = await ethers.getContractFactory("XPowerLokiNftStaked");
    expect(NftStaked).to.exist;
    NftTreasury = await ethers.getContractFactory("NftTreasury");
    expect(NftTreasury).to.exist;
  });
  beforeEach(async function () {
    nft = await Nft.deploy(
      NFT_LOKI_URL,
      NONE_ADDRESS,
      DEADLINE,
      xpower.address
    );
    expect(nft).to.exist;
    await nft.deployed();
    nft_staked = await NftStaked.deploy(NFT_LOKI_URL, NONE_ADDRESS, DEADLINE);
    expect(nft_staked).to.exist;
    await nft_staked.deployed();
    nft_treasury = await NftTreasury.deploy(nft.address, nft_staked.address);
    expect(nft_treasury).to.exist;
    await nft_treasury.deployed();
  });
  beforeEach(async function () {
    await mintToken(1);
    await increaseAllowanceBy(1, nft.address);
  });
  describe("stake", async function () {
    it("should stake nft for amount=1", async function () {
      const [owner, address] = [addresses[0], nft_treasury.address];
      const nft_id = await mintNft(0, 1);
      expect(nft_id.gt(0)).to.eq(true);
      const tx_approval = await await nft.setApprovalForAll(address, true);
      expect(tx_approval).to.be.an("object");
      const tx_transfer = await nft_staked.transferOwnership(address);
      expect(tx_transfer).to.be.an("object");
      const tx_stake = await nft_treasury.stake(owner, nft_id, 1);
      expect(tx_stake).to.be.an("object");
      const nft_staked_balance = await nft_staked.balanceOf(owner, nft_id);
      expect(nft_staked_balance).to.eq(1);
      const nft_treasury_balance = await nft.balanceOf(address, nft_id);
      expect(nft_treasury_balance).to.eq(1);
      const nft_balance = await nft.balanceOf(owner, nft_id);
      expect(nft_balance).to.eq(0);
    });
    it("should *not* stake nft for amount=1 (not approved)", async function () {
      const [owner, address] = [addresses[0], nft_treasury.address];
      const nft_id = await mintNft(0, 1);
      expect(nft_id.gt(0)).to.eq(true);
      const tx_transfer = await nft_staked.transferOwnership(address);
      expect(tx_transfer).to.be.an("object");
      const tx_stake = await nft_treasury
        .stake(owner, nft_id, 1)
        .catch((ex) => {
          const m = ex.message.match(/caller is not owner nor approved/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(tx_stake).to.eq(undefined);
    });
    it("should *not* stake nft for amount=1 (not owner)", async function () {
      const [owner, address] = [addresses[0], nft_treasury.address];
      const nft_id = await mintNft(0, 1);
      expect(nft_id.gt(0)).to.eq(true);
      const tx_approval = await await nft.setApprovalForAll(address, true);
      expect(tx_approval).to.be.an("object");
      const tx_stake = await nft_treasury
        .stake(owner, nft_id, 1)
        .catch((ex) => {
          const m = ex.message.match(/caller is not the owner/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(tx_stake).to.eq(undefined);
    });
    it("should *not* stake nft for amount=0 (non-positive amount)", async function () {
      const [owner, address] = [addresses[0], nft_treasury.address];
      const nft_id = await mintNft(0, 1);
      expect(nft_id.gt(0)).to.eq(true);
      const tx_approval = await await nft.setApprovalForAll(address, true);
      expect(tx_approval).to.be.an("object");
      const tx_transfer = await nft_staked.transferOwnership(address);
      expect(tx_transfer).to.be.an("object");
      const tx_stake = await nft_treasury
        .stake(owner, nft_id, 0)
        .catch((ex) => {
          const m = ex.message.match(/non-positive amount/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(tx_stake).to.eq(undefined);
    });
  });
  describe("stake-batch", async function () {
    it("should stake-batch nft(s) for amount=1", async function () {
      const [owner, address] = [addresses[0], nft_treasury.address];
      const nft_id = await mintNft(0, 1);
      expect(nft_id.gt(0)).to.eq(true);
      const tx_approval = await await nft.setApprovalForAll(address, true);
      expect(tx_approval).to.be.an("object");
      const tx_transfer = await nft_staked.transferOwnership(address);
      expect(tx_transfer).to.be.an("object");
      const tx_stake = await nft_treasury.stakeBatch(owner, [nft_id], [1]);
      expect(tx_stake).to.be.an("object");
      const nft_staked_balance = await nft_staked.balanceOf(owner, nft_id);
      expect(nft_staked_balance).to.eq(1);
      const nft_treasury_balance = await nft.balanceOf(address, nft_id);
      expect(nft_treasury_balance).to.eq(1);
      const nft_balance = await nft.balanceOf(owner, nft_id);
      expect(nft_balance).to.eq(0);
    });
    it("should *not* stake-batch nft(s) for amount=1 (not approved)", async function () {
      const [owner, address] = [addresses[0], nft_treasury.address];
      const nft_id = await mintNft(0, 1);
      expect(nft_id.gt(0)).to.eq(true);
      const tx_transfer = await nft_staked.transferOwnership(address);
      expect(tx_transfer).to.be.an("object");
      const tx_stake = await nft_treasury
        .stakeBatch(owner, [nft_id], [1])
        .catch((ex) => {
          const m = ex.message.match(/caller is not owner nor approved/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(tx_stake).to.eq(undefined);
    });
    it("should *not* stake-batch nft(s) for amount=1 (not owner)", async function () {
      const [owner, address] = [addresses[0], nft_treasury.address];
      const nft_id = await mintNft(0, 1);
      expect(nft_id.gt(0)).to.eq(true);
      const tx_approval = await await nft.setApprovalForAll(address, true);
      expect(tx_approval).to.be.an("object");
      const tx_stake = await nft_treasury
        .stakeBatch(owner, [nft_id], [1])
        .catch((ex) => {
          const m = ex.message.match(/caller is not the owner/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(tx_stake).to.eq(undefined);
    });
    it("should *not* stake-batch nft(s) for amount=0 (non-positive amount)", async function () {
      const [owner, address] = [addresses[0], nft_treasury.address];
      const nft_id = await mintNft(0, 1);
      expect(nft_id.gt(0)).to.eq(true);
      const tx_approval = await await nft.setApprovalForAll(address, true);
      expect(tx_approval).to.be.an("object");
      const tx_transfer = await nft_staked.transferOwnership(address);
      expect(tx_transfer).to.be.an("object");
      const tx_stake = await nft_treasury
        .stakeBatch(owner, [nft_id], [0])
        .catch((ex) => {
          const m = ex.message.match(/non-positive amount/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(tx_stake).to.eq(undefined);
    });
  });
  describe("unstake", async function () {
    it("should unstake nft for amount=1", async function () {
      const [owner, address] = [addresses[0], nft_treasury.address];
      const nft_id = await mintNft(0, 1);
      expect(nft_id.gt(0)).to.eq(true);
      const tx_approval = await await nft.setApprovalForAll(address, true);
      expect(tx_approval).to.be.an("object");
      const tx_transfer = await nft_staked.transferOwnership(address);
      expect(tx_transfer).to.be.an("object");
      const tx_stake = await nft_treasury.stake(owner, nft_id, 1);
      expect(tx_stake).to.be.an("object");
      const tx_unstake = await nft_treasury.unstake(owner, nft_id, 1);
      expect(tx_unstake).to.be.an("object");
      const nft_staked_balance = await nft_staked.balanceOf(owner, nft_id);
      expect(nft_staked_balance).to.eq(0);
      const nft_treasury_balance = await nft.balanceOf(address, nft_id);
      expect(nft_treasury_balance).to.eq(0);
      const nft_balance = await nft.balanceOf(owner, nft_id);
      expect(nft_balance).to.eq(1);
    });
    it("should *not* unstake nft for amount=0 (non-positive amount)", async function () {
      const [owner, address] = [addresses[0], nft_treasury.address];
      const nft_id = await mintNft(0, 1);
      expect(nft_id.gt(0)).to.eq(true);
      const tx_approval = await await nft.setApprovalForAll(address, true);
      expect(tx_approval).to.be.an("object");
      const tx_transfer = await nft_staked.transferOwnership(address);
      expect(tx_transfer).to.be.an("object");
      const tx_stake = await nft_treasury.stake(owner, nft_id, 1);
      expect(tx_stake).to.be.an("object");
      const tx_unstake = await nft_treasury
        .stake(owner, nft_id, 0)
        .catch((ex) => {
          const m = ex.message.match(/non-positive amount/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(tx_unstake).to.eq(undefined);
    });
  });
  describe("unstake-batch", async function () {
    it("should unstake-batch nft(s) for amount=1", async function () {
      const [owner, address] = [addresses[0], nft_treasury.address];
      const nft_id = await mintNft(0, 1); // UNIT NFT
      expect(nft_id.gt(0)).to.eq(true);
      const tx_approval = await await nft.setApprovalForAll(address, true);
      expect(tx_approval).to.be.an("object");
      const tx_transfer = await nft_staked.transferOwnership(address);
      expect(tx_transfer).to.be.an("object");
      const tx_stake = await nft_treasury.stakeBatch(owner, [nft_id], [1]);
      expect(tx_stake).to.be.an("object");
      const tx_unstake = await nft_treasury.unstakeBatch(owner, [nft_id], [1]);
      expect(tx_unstake).to.be.an("object");
      const nft_staked_balance = await nft_staked.balanceOf(owner, nft_id);
      expect(nft_staked_balance).to.eq(0);
      const nft_treasury_balance = await nft.balanceOf(address, nft_id);
      expect(nft_treasury_balance).to.eq(0);
      const nft_balance = await nft.balanceOf(owner, nft_id);
      expect(nft_balance).to.eq(1);
    });
    it("should *not* unstake-batch nft(s) for amount=0 (non-positive amount)", async function () {
      const [owner, address] = [addresses[0], nft_treasury.address];
      const nft_id = await mintNft(0, 1); // UNIT NFT
      expect(nft_id.gt(0)).to.eq(true);
      const tx_approval = await await nft.setApprovalForAll(address, true);
      expect(tx_approval).to.be.an("object");
      const tx_transfer = await nft_staked.transferOwnership(address);
      expect(tx_transfer).to.be.an("object");
      const tx_stake = await nft_treasury.stakeBatch(owner, [nft_id], [1]);
      expect(tx_stake).to.be.an("object");
      const tx_unstake = await nft_treasury
        .stakeBatch(owner, [nft_id], [0])
        .catch((ex) => {
          const m = ex.message.match(/non-positive amount/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(tx_unstake).to.eq(undefined);
    });
  });
});
async function mintToken(amount) {
  const [nonce, block_hash] = table.getNonce({ amount });
  expect(nonce).to.gte(0);
  const tx_mint = await xpower.mint(addresses[0], block_hash, nonce);
  expect(tx_mint).to.be.an("object");
  const balance_0 = await xpower.balanceOf(addresses[0]);
  expect(balance_0.toNumber()).to.be.gte(amount);
  const balance_1 = await xpower.balanceOf(addresses[1]);
  expect(balance_1.toNumber()).to.eq(0);
}
async function increaseAllowanceBy(amount, spender) {
  const tx_increase = await xpower.increaseAllowance(spender, amount);
  expect(tx_increase).to.be.an("object");
  const allowance = await xpower.allowance(addresses[0], spender);
  expect(allowance.toNumber()).to.be.gte(amount);
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
