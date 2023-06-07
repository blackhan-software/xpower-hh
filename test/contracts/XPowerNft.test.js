/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Nft; // contracts
let moe, nft; // instances
let UNIT; // decimals

const { HashTable } = require("../hash-table");
const tables = {}; // pre-hashed nonces

const NFT_LOKI_URL = "https://xpowermine.com/nfts/loki/{id}.json";
const DEADLINE = 0; // [seconds]

describe("XPowerNft", async function () {
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
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.exist;
    Moe = await ethers.getContractFactory("XPowerLoki");
    expect(Moe).to.exist;
  });
  beforeEach(async function () {
    moe = await Moe.deploy([], DEADLINE);
    expect(moe).to.exist;
    await moe.deployed();
    await moe.transferOwnership(addresses[1]);
    await moe.init();
  });
  beforeEach(async function () {
    const a0 = addresses[0];
    tables[a0] = await new HashTable(moe, a0).init();
    const a2 = addresses[2];
    tables[a2] = await new HashTable(moe, a2).init();
  });
  beforeEach(async function () {
    const decimals = await moe.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.be.true;
  });
  beforeEach(async function () {
    nft = await Nft.deploy(NFT_LOKI_URL, [moe.address], [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
  });
  after(async function () {
    const [owner, signer_1] = await ethers.getSigners();
    await moe.connect(signer_1).transferOwnership(owner.address);
  });
  describe("mint", async function () {
    it("should mint XPower for amount=3", async function () {
      await moeMint(3);
    });
    it("should increase XPower allowance by amount=3", async function () {
      await allowanceOf(3);
    });
    it("should mint NFTs for level=UNIT & amount=3", async function () {
      await moeMint(3);
      await allowanceOf(3);
      await nftMint(3);
    });
    it("should *not* mint NFTs (non-ternary level)", async function () {
      expect(
        await nftMint(3, 2).catch((ex) => {
          const m = ex.message.match(/non-ternary level/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* mint NFTs (transfer amount exceeds balance)", async function () {
      await allowanceOf(3);
      expect(
        await nftMint(3).catch((ex) => {
          const m = ex.message.match(/transfer amount exceeds balance/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* mint NFTs (insufficient allowance)", async function () {
      expect(
        await nftMint(3).catch((ex) => {
          const m = ex.message.match(/insufficient allowance/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("burn", async function () {
    it("should burn NFTs for level=UNIT & amount=3", async function () {
      await moeMint(3);
      await allowanceOf(3);
      await nftMint(3);
      await nftBurn(3);
    });
    it("should *not* burn NFTs (non-ternary level)", async function () {
      expect(
        await nftBurn(3, 2).catch((ex) => {
          const m = ex.message.match(/non-ternary level/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* burn NFTs (burn amount exceeds totalSupply)", async function () {
      expect(
        await nftBurn(3).catch((ex) => {
          const m = ex.message.match(/burn amount exceeds totalSupply/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* burn NFTs (burn amount exceeds balance)", async function () {
      await moeMint(3, accounts[2]);
      await allowanceOf(3, accounts[2]);
      await nftMint(3, 0, accounts[2]);
      expect(
        await nftBurn(3).catch((ex) => {
          const m = ex.message.match(/burn amount exceeds balance/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("mint-batch", async function () {
    it("should mint XPower for amount=1", async function () {
      await moeMint(3);
    });
    it("should increase XPower allowance by amount=1", async function () {
      await allowanceOf(3);
    });
    it("should mint NFTs for level=UNIT & amount=1", async function () {
      await moeMint(3);
      await allowanceOf(3);
      await nftMintBatch(3);
    });
    it("should *not* mint NFTs (non-ternary level[0])", async function () {
      expect(
        await nftMintBatch(3, 2).catch((ex) => {
          const m = ex.message.match(/non-ternary level/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* mint NFTs (transfer amount exceeds balance)", async function () {
      await allowanceOf(3);
      expect(
        await nftMintBatch(3).catch((ex) => {
          const m = ex.message.match(/transfer amount exceeds balance/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* mint NFTs (insufficient allowance)", async function () {
      expect(
        await nftMintBatch(3).catch((ex) => {
          const m = ex.message.match(/insufficient allowance/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("burn-batch", async function () {
    it("should burn NFTs for level=UNIT & amount=3", async function () {
      await moeMint(3);
      await allowanceOf(3);
      await nftMintBatch(3);
      await nftBurnBatch(3);
    });
    it("should *not* burn NFTs (non-ternary level)", async function () {
      expect(
        await nftBurnBatch(3, 2).catch((ex) => {
          const m = ex.message.match(/non-ternary level/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* burn NFTs (burn amount exceeds totalSupply)", async function () {
      expect(
        await nftBurnBatch(3).catch((ex) => {
          const m = ex.message.match(/burn amount exceeds totalSupply/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
    it("should *not* burn NFTs (burn amount exceeds balance)", async function () {
      await moeMint(3, accounts[2]);
      await allowanceOf(3, accounts[2]);
      await nftMintBatch(3, 0, accounts[2]);
      expect(
        await nftBurnBatch(3).catch((ex) => {
          const m = ex.message.match(/burn amount exceeds balance/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
});
async function allowanceOf(n, a = accounts[0]) {
  if (typeof n !== "bigint") n = BigInt(n);
  const tx = await moe.connect(a).increaseAllowance(nft.address, n * UNIT);
  expect(tx).to.be.an("object");
}
async function moeMint(n, a = accounts[0], o = accounts[1]) {
  const [nonce, block_hash] = tables[a.address].getNonce({ amount: n });
  expect(nonce.gte(0)).to.eq(true);
  const tx = await moe.connect(a).mint(a.address, block_hash, nonce);
  expect(tx).to.be.an("object");
  expect(await moe.balanceOf(a.address)).to.eq((BigInt(n) * UNIT) / 1n);
  expect(await moe.balanceOf(o.address)).to.eq((BigInt(n) * UNIT) / 2n);
  return tx;
}
async function nftMint(n, l = 0, a = accounts[0]) {
  const year = (await nft.year()).toNumber();
  expect(year).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(a.address);
  const moe_index = await nft.moeIndexOf(moe.address);
  const tx = await nft.connect(a).mint(a.address, l, n, moe_index);
  const new_balance = await moe.balanceOf(a.address);
  expect(old_balance.sub(new_balance)).to.eq(BigInt(n) * UNIT);
  const moe_prefix = await moe.prefix();
  expect(moe_prefix.toNumber()).to.be.greaterThan(0);
  const nft_id = (await nft.idBy(year, l, moe_prefix)).toNumber();
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await nft.balanceOf(a.address, nft_id);
  expect(nft_balance.toNumber()).to.eq(n);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply.toNumber()).to.eq(n);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_LOKI_URL);
  return tx;
}
async function nftBurn(n, l = 0, a = accounts[0]) {
  const year = await nft.year();
  expect(year.toNumber()).to.be.greaterThan(0);
  const moe_prefix = await moe.prefix();
  expect(moe_prefix.toNumber()).to.be.greaterThan(0);
  const nft_id = await nft.idBy(year, l, moe_prefix);
  expect(nft_id.toNumber()).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(a.address);
  const tx = await nft.connect(a).burn(a.address, nft_id, n);
  const new_balance = await moe.balanceOf(a.address);
  expect(old_balance.add(new_balance)).to.eq(BigInt(n) * UNIT);
  const nft_balance = await nft.balanceOf(a.address, nft_id);
  expect(nft_balance).to.eq(0);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply).to.eq(0);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(false);
  return tx;
}
async function nftMintBatch(n, l = 0, a = accounts[0]) {
  const year = await nft.year();
  expect(year.toNumber()).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(a.address);
  const moe_index = await nft.moeIndexOf(moe.address);
  const tx = await nft.connect(a).mintBatch(a.address, [l], [n], moe_index);
  const new_balance = await moe.balanceOf(a.address);
  expect(old_balance.sub(new_balance)).to.eq(BigInt(n) * UNIT);
  const moe_prefix = await moe.prefix();
  const nft_ids = await nft.idsBy(year, [l], moe_prefix);
  expect(nft_ids.length).to.be.greaterThan(0);
  const nft_id = nft_ids[0].toNumber();
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await nft.balanceOf(a.address, nft_id);
  expect(nft_balance.toNumber()).to.eq(n);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply.toNumber()).to.eq(n);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_LOKI_URL);
  return tx;
}
async function nftBurnBatch(n, l = 0, a = accounts[0]) {
  const year = await nft.year();
  expect(year.toNumber()).to.be.greaterThan(0);
  const moe_prefix = await moe.prefix();
  expect(moe_prefix.toNumber()).to.be.greaterThan(0);
  const nft_id = await nft.idBy(year, l, moe_prefix);
  expect(nft_id.toNumber()).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(a.address);
  const tx = await nft.connect(a).burnBatch(a.address, [nft_id], [n]);
  const new_balance = await moe.balanceOf(a.address);
  expect(old_balance.add(new_balance)).to.eq(BigInt(n) * UNIT);
  const nft_balance = await nft.balanceOf(a.address, nft_id);
  expect(nft_balance).to.eq(0);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply).to.eq(0);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(false);
  return tx;
}
