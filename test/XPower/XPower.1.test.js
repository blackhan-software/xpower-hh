const { ethers } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe; // contract
let moe; // instance
let UNIT; // decimals

// 1 / 9th share of minted XPOW
const PART = BigInt(1e18) / 8n;

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

describe("XPower", async function () {
  before(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
    addresses = accounts.map((acc) => acc.address);
    expect(addresses.length).to.be.greaterThan(1);
  });
  before(async function () {
    Moe = await ethers.getContractFactory("XPowerTest");
  });
  beforeEach(async function () {
    moe = await Moe.deploy([], 0);
    expect(moe).to.be.an("object");
    await moe.transferOwnership(addresses[1]);
    await moe.init();
  });
  beforeEach(async function () {
    table = await new HashTable(moe, addresses[0]).init();
  });
  beforeEach(async function () {
    const decimals = await moe.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.eq(true);
  });
  afterEach(async function () {
    const [_owner, signer_1] = await ethers.getSigners();
    await moe.connect(signer_1).transferOwnership(addresses[0]);
  });
  describe("mint", async function () {
    it("should *not* mint for amount=0 (empty nonce-hash)", async function () {
      const [nonce, block_hash] = table.getNonce({ amount: 0 });
      expect(nonce).to.match(/^0x[a-f0-9]+$/);
      const tx = await moe.mint(addresses[0], block_hash, nonce).catch((ex) => {
        const m = ex.message.match(/empty nonce-hash/);
        if (m === null) console.debug(ex);
        expect().to.not.eq(null);
      });
      expect(tx).to.eq(undefined);
      expect(await moe.balanceOf(addresses[0])).to.eq(0n);
      expect(await moe.balanceOf(addresses[1])).to.eq(0n);
    });
    it("should mint for amount=1", async function () {
      const [nonce, block_hash] = table.getNonce({ amount: 1 });
      expect(nonce).to.match(/^0x[a-f0-9]+$/);
      const tx = await moe.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await moe.balanceOf(addresses[0])).to.eq(UNIT);
      expect(await moe.balanceOf(addresses[1])).to.eq(PART);
    });
    it("should mint for amount=1 once (duplicate nonce-hash)", async function () {
      const [nonce, block_hash] = table.getNonce({ amount: 1 });
      expect(nonce).to.match(/^0x[a-f0-9]+$/);
      const tx_1st = await moe.mint(addresses[0], block_hash, nonce);
      expect(tx_1st).to.be.an("object");
      expect(await moe.balanceOf(addresses[0])).to.eq(UNIT);
      expect(await moe.balanceOf(addresses[1])).to.eq(PART);
      const tx_2nd = await moe
        .mint(addresses[0], block_hash, nonce)
        .catch((ex) => {
          const m = ex.message.match(/duplicate nonce-hash/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        });
      expect(tx_2nd).to.eq(undefined);
      expect(await moe.balanceOf(addresses[0])).to.eq(UNIT);
      expect(await moe.balanceOf(addresses[1])).to.eq(PART);
    });
    it("should *not* mint for amount=1 (expired block-hash)", async function () {
      const [nonce] = table.getNonce({ amount: 1 });
      expect(nonce).to.match(/^0x[a-f0-9]+$/);
      const block_hash =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const tx = await moe.mint(addresses[0], block_hash, nonce).catch((ex) => {
        const m = ex.message.match(/expired block-hash/);
        if (m == null) console.debug(ex);
        expect(m).to.not.eq(null);
      });
      expect(tx).to.eq(undefined);
    });
    it("should mint for amount=3", async function () {
      const [nonce, block_hash] = table.getNonce({ amount: 3 });
      expect(nonce).to.match(/^0x[a-f0-9]+$/);
      const tx = await moe.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await moe.balanceOf(addresses[0])).to.eq(3n * UNIT);
      expect(await moe.balanceOf(addresses[1])).to.eq(3n * PART);
    });
    it("should mint for amount=3 once (duplicate nonce-hash)", async function () {
      const [nonce, block_hash] = table.getNonce({ amount: 3 });
      expect(nonce).to.match(/^0x[a-f0-9]+$/);
      const tx_1 = await moe.mint(addresses[0], block_hash, nonce);
      expect(tx_1).to.be.an("object");
      expect(await moe.balanceOf(addresses[0])).to.eq(3n * UNIT);
      expect(await moe.balanceOf(addresses[1])).to.eq(3n * PART);
      const tx_2nd = await moe
        .mint(addresses[0], block_hash, nonce)
        .catch((ex) => {
          const m = ex.message.match(/duplicate nonce-hash/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        });
      expect(tx_2nd).to.eq(undefined);
      expect(await moe.balanceOf(addresses[0])).to.eq(3n * UNIT);
      expect(await moe.balanceOf(addresses[1])).to.eq(3n * PART);
    });
    it("should *not* mint for amount=3 (expired block-hash)", async function () {
      const [nonce] = table.getNonce({ amount: 3 });
      expect(nonce).to.match(/^0x[a-f0-9]+$/);
      const block_hash =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const tx = await moe.mint(addresses[0], block_hash, nonce).catch((ex) => {
        const m = ex.message.match(/expired block-hash/);
        if (m === null) console.debug(ex);
        expect(m).to.not.eq(null);
      });
      expect(tx).to.eq(undefined);
    });
  });
  describe("mint & burn", async function () {
    it("should *not* mint for amount=0 (empty nonce-hash) & *not* burn 1 token (burn amount exceeds balance)", async function () {
      const [nonce, block_hash] = table.getNonce({ amount: 0 });
      expect(nonce).to.match(/^0x[a-f0-9]+$/);
      const tx_mint = await moe
        .mint(addresses[0], block_hash, nonce)
        .catch((ex) => {
          const m = ex.message.match(/empty nonce-hash/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        });
      expect(tx_mint).to.eq(undefined);
      expect(await moe.balanceOf(addresses[0])).to.eq(0n);
      expect(await moe.balanceOf(addresses[1])).to.eq(0n);
      const tx_burn = await moe.burn(1).catch((ex) => {
        const m = ex.message.match(/burn amount exceeds balance/);
        if (m === null) console.debug(ex);
        expect(m).to.not.eq(null);
      });
      expect(tx_burn).to.eq(undefined);
      expect(await moe.balanceOf(addresses[0])).to.eq(0n);
      expect(await moe.balanceOf(addresses[1])).to.eq(0n);
    });
    it("should *not* mint for amount=0 (empty nonce-hash) & *not* burn 2 tokens (burn amount exceeds balance)", async function () {
      const [nonce, block_hash] = table.getNonce({ amount: 0 });
      expect(nonce).to.match(/^0x[a-f0-9]+$/);
      const tx_mint = await moe
        .mint(addresses[0], block_hash, nonce)
        .catch((ex) => {
          const m = ex.message.match(/empty nonce-hash/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        });
      expect(tx_mint).to.eq(undefined);
      expect(await moe.balanceOf(addresses[0])).to.eq(0n);
      expect(await moe.balanceOf(addresses[1])).to.eq(0n);
      const tx_burn = await moe.burn(2).catch((ex) => {
        const m = ex.message.match(/burn amount exceeds balance/);
        if (m === null) console.debug(ex);
        expect(m).to.not.eq(null);
      });
      expect(tx_burn).to.eq(undefined);
      expect(await moe.balanceOf(addresses[0])).to.eq(0n);
      expect(await moe.balanceOf(addresses[1])).to.eq(0n);
    });
    it("should mint for amount=1 & burn 1 token", async function () {
      const [nonce, block_hash] = table.getNonce({ amount: 1 });
      expect(nonce).to.match(/^0x[a-f0-9]+$/);
      const tx = await moe.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await moe.balanceOf(addresses[0])).to.eq(UNIT);
      expect(await moe.balanceOf(addresses[1])).to.eq(PART);
      await moe.burn(UNIT);
      expect(await moe.balanceOf(addresses[0])).to.eq(0n);
      expect(await moe.balanceOf(addresses[1])).to.eq(PART);
    });
    it("should mint for amount=3 & burn 2 tokens", async function () {
      const [nonce, block_hash] = table.getNonce({ amount: 3 });
      expect(nonce).to.match(/^0x[a-f0-9]+$/);
      const tx = await moe.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await moe.balanceOf(addresses[0])).to.eq(3n * UNIT);
      expect(await moe.balanceOf(addresses[1])).to.eq(3n * PART);
      await moe.burn(2n * UNIT);
      expect(await moe.balanceOf(addresses[0])).to.eq(1n * UNIT);
      expect(await moe.balanceOf(addresses[1])).to.eq(3n * PART);
    });
  });
});
