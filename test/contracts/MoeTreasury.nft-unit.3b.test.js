/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Sov, Nft, Ppt, Mty, Nty; // contracts
let moe, sov, nft, ppt, mty, nty; // instances
let UNIT; // decimals

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years
const DAYS = 86_400; // [seconds]
const YEAR = 365.25 * DAYS;
const U256 = 2n ** 256n - 1n;

describe("MoeTreasury", async function () {
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
  before(async function () {
    moe = await Moe.deploy([], DEADLINE);
    expect(moe).to.exist;
    await moe.deployed();
    await moe.init();
    sov = await Sov.deploy(moe.address, [], DEADLINE);
    expect(sov).to.exist;
    await sov.deployed();
  });
  before(async function () {
    const decimals = await moe.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.be.true;
  });
  before(async function () {
    nft = await Nft.deploy(moe.address, NFT_XPOW_URL, [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
    ppt = await Ppt.deploy(NFT_XPOW_URL, [], DEADLINE);
    expect(ppt).to.exist;
    await ppt.deployed();
  });
  before(async function () {
    mty = await Mty.deploy(moe.address, sov.address, ppt.address);
    expect(mty).to.exist;
    await mty.deployed();
    nty = await Nty.deploy(nft.address, ppt.address, mty.address);
    expect(nty).to.exist;
    await nty.deployed();
  });
  before(async function () {
    await sov.transferOwnership(mty.address);
    expect(await sov.owner()).to.eq(mty.address);
  });
  before(async function () {
    table = await new HashTable(moe, addresses[0]).init({
      use_cache: true,
      min_level: 4,
      max_level: 4,
      length: 1,
    });
    await mintToken(15);
    table.reset();
  });
  before(async function () {
    const supply = await moe.totalSupply();
    expect(supply).to.be.gte(15n * UNIT);
  });
  before(async function () {
    await increaseAllowanceBy(15n * UNIT, nft.address);
  });
  before(async function () {
    await moe.transfer(mty.address, 1n * UNIT);
  });
  describe("moeBalance", async function () {
    it("should return 1n [XPOW]", async function () {
      expect(await moe.balanceOf(mty.address)).to.eq(1n * UNIT);
    });
  });
  describe("claimFor", async function () {
    let account, nft_id;
    it("should stake UNIT NFTs", async function () {
      [account, nft_id] = await stakeNft(await mintNft(0, 1), 1);
    });
    it("should return zero [XPOW] in 0 year", async function () {
      console.log(
        `[APR] ${await mty.aprOf(nft_id)} & ${await mty.aprBonusOf(nft_id)}`
      );
      expect(await mty.claimableFor(account, nft_id)).to.eq(0n * UNIT);
      const claimed = await mty.claimFor(account, nft_id).catch((ex) => {
        const m = ex.message.match(/nothing claimable/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(claimed).to.eq(undefined);
    });
    it(`should grant reparametrization right`, async function () {
      await mty.grantRole(mty.APR_ROLE(), addresses[0]);
    });
    it("should reparameterize (per nft.level)", async function () {
      const tx = await mty.setAPRBatch([202100], [1_000_000, U256, 1_000_000]);
      expect(tx).to.not.eq(undefined);
    });
    it("should forward time by one year", async function () {
      await network.provider.send("evm_increaseTime", [YEAR]);
      await network.provider.send("evm_mine", []);
    });
    it("should return zero [XPOW] in 1 year", async function () {
      console.log(
        `[APR] ${await mty.aprOf(nft_id)} & ${await mty.aprBonusOf(nft_id)}`
      );
      expect(await mty.claimableFor(account, nft_id)).to.eq(0n * UNIT);
      const claimed = await mty.claimFor(account, nft_id).catch((ex) => {
        const m = ex.message.match(/nothing claimable/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(claimed).to.eq(undefined);
    });
    it("should reparameterize (per nft.level)", async function () {
      const tx = await mty.setAPRBatch([202100], [2_000_000, U256, 2_000_000]);
      expect(tx).to.not.eq(undefined);
    });
    it("should forward time by one year", async function () {
      await network.provider.send("evm_increaseTime", [YEAR]);
      await network.provider.send("evm_mine", []);
    });
    it("should return zero [XPOW] in 2 years", async function () {
      console.log(
        `[APR] ${await mty.aprOf(nft_id)} & ${await mty.aprBonusOf(nft_id)}`
      );
      expect(await mty.claimableFor(account, nft_id)).to.eq(0n * UNIT);
      const claimed = await mty.claimFor(account, nft_id).catch((ex) => {
        const m = ex.message.match(/nothing claimable/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(claimed).to.eq(undefined);
    });
    it("should reparameterize (per nft.level)", async function () {
      const tx = await mty.setAPRBatch([202100], [1_000_000, U256, 1_000_000]);
      expect(tx).to.not.eq(undefined);
    });
    it("should forward time by one year", async function () {
      await network.provider.send("evm_increaseTime", [YEAR]);
      await network.provider.send("evm_mine", []);
    });
    it("should return zero [XPOW] in 3 years", async function () {
      console.log(
        `[APR] ${await mty.aprOf(nft_id)} & ${await mty.aprBonusOf(nft_id)}`
      );
      expect(await mty.claimableFor(account, nft_id)).to.eq(0n * UNIT);
      const claimed = await mty.claimFor(account, nft_id).catch((ex) => {
        const m = ex.message.match(/nothing claimable/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(claimed).to.eq(undefined);
    });
    it("should reparameterize (per nft.level)", async function () {
      const tx = await mty.setAPRBatch([202100], [1_000_000, U256, 1_000_000]);
      expect(tx).to.not.eq(undefined);
    });
    it("should forward time by one year", async function () {
      await network.provider.send("evm_increaseTime", [YEAR]);
      await network.provider.send("evm_mine", []);
    });
    it("should return zero [XPOW] in 4 years", async function () {
      console.log(
        `[APR] ${await mty.aprOf(nft_id)} & ${await mty.aprBonusOf(nft_id)}`
      );
      expect(await mty.claimableFor(account, nft_id)).to.eq(0n * UNIT);
      const claimed = await mty.claimFor(account, nft_id).catch((ex) => {
        const m = ex.message.match(/nothing claimable/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(claimed).to.eq(undefined);
    });
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
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply).to.eq(amount);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(nft_balance.gt(0));
  return nft_id;
}
async function stakeNft(nft_id, amount) {
  const [account, address] = [addresses[0], nty.address];
  const tx_approval = await await nft.setApprovalForAll(address, true);
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
  expect(nft_balance).to.eq(nft_balance_old.sub(amount));
  return [account, nft_id];
}
