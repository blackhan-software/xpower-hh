/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contract
let xpower; // instance
let UNIT; // decimals

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const DEADLINE = 126_230_400; // [seconds] i.e. 4 years

describe("XPower", async function () {
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
    XPower = await ethers.getContractFactory("XPowerLokiTest");
  });
  beforeEach(async function () {
    xpower = await XPower.deploy([], DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
    await xpower.transferOwnership(addresses[1]);
    await xpower.init();
  });
  beforeEach(async function () {
    table = await new HashTable(xpower, addresses[0]).init();
  });
  beforeEach(async function () {
    const decimals = await xpower.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.be.true;
  });
  afterEach(async function () {
    const [owner, signer_1] = await ethers.getSigners();
    await xpower.connect(signer_1).transferOwnership(addresses[0]);
  });
  describe("mint", async function () {
    it("should *not* mint for amount=0", async function () {
      const [nonce, block_hash] = table.getNonce({ amount: 0 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower
        .mint(addresses[0], block_hash, nonce)
        .catch((ex) => {
          const m = ex.message.match(/empty nonce-hash/);
          if (m === null) console.debug(ex);
          expect().to.be.not.null;
        });
      expect(tx).to.eq(undefined);
      expect((await xpower.balanceOf(addresses[0])).toBigInt()).to.eq(0n);
      expect((await xpower.balanceOf(addresses[1])).toBigInt()).to.eq(0n);
    });
    it("should mint for amount=1", async function () {
      const [nonce, block_hash] = table.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect((await xpower.balanceOf(addresses[0])).toBigInt()).to.eq(UNIT);
      expect((await xpower.balanceOf(addresses[1])).toBigInt()).to.eq(
        UNIT / 2n
      );
    });
    it("should mint for amount=1 once", async function () {
      const [nonce, block_hash] = table.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const tx_1st = await xpower.mint(addresses[0], block_hash, nonce);
      expect(tx_1st).to.be.an("object");
      expect((await xpower.balanceOf(addresses[0])).toBigInt()).to.eq(UNIT);
      expect((await xpower.balanceOf(addresses[1])).toBigInt()).to.eq(
        UNIT / 2n
      );
      const tx_2nd = await xpower
        .mint(addresses[0], block_hash, nonce)
        .catch((ex) => {
          const m = ex.message.match(/duplicate nonce-hash/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(tx_2nd).to.eq(undefined);
      expect((await xpower.balanceOf(addresses[0])).toBigInt()).to.eq(UNIT);
      expect((await xpower.balanceOf(addresses[1])).toBigInt()).to.eq(
        UNIT / 2n
      );
    });
    it("should *not* mint for amount=1 & invalid block-hash", async function () {
      const [nonce] = table.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const block_hash =
        "0x0000000000000000000000000000000000000000000000000000000000000000";
      expect(block_hash).to.exist;
      const tx = await xpower
        .mint(addresses[0], block_hash, nonce)
        .catch((ex) => {
          const m = ex.message.match(/invalid block-hash/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(tx).to.eq(undefined);
    });
    it("should *not* mint for amount=1 & expired block-hash", async function () {
      const [nonce] = table.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const block_hash =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      expect(block_hash).to.exist;
      const tx = await xpower
        .mint(addresses[0], block_hash, nonce)
        .catch((ex) => {
          const m = ex.message.match(/expired block-hash/);
          if (m == null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(tx).to.eq(undefined);
    });
    it("should mint for amount=3", async function () {
      const [nonce, block_hash] = table.getNonce({ amount: 3 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect((await xpower.balanceOf(addresses[0])).toBigInt()).to.eq(
        3n * UNIT
      );
      expect((await xpower.balanceOf(addresses[1])).toBigInt()).to.eq(
        (3n * UNIT) / 2n
      );
    });
    it("should mint for amount=3 once", async function () {
      const [nonce, block_hash] = table.getNonce({ amount: 3 });
      expect(nonce.gte(0)).to.eq(true);
      const tx_1 = await xpower.mint(addresses[0], block_hash, nonce);
      expect(tx_1).to.be.an("object");
      expect((await xpower.balanceOf(addresses[0])).toBigInt()).to.eq(
        3n * UNIT
      );
      expect((await xpower.balanceOf(addresses[1])).toBigInt()).to.eq(
        (3n * UNIT) / 2n
      );
      const tx_2nd = await xpower
        .mint(addresses[0], block_hash, nonce)
        .catch((ex) => {
          const m = ex.message.match(/duplicate nonce-hash/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(tx_2nd).to.eq(undefined);
      expect((await xpower.balanceOf(addresses[0])).toBigInt()).to.eq(
        3n * UNIT
      );
      expect((await xpower.balanceOf(addresses[1])).toBigInt()).to.eq(
        (3n * UNIT) / 2n
      );
    });
    it("should *not* mint for amount=3 & invalid block-hash", async function () {
      const [nonce] = table.getNonce({ amount: 3 });
      expect(nonce.gte(0)).to.eq(true);
      const block_hash =
        "0x0000000000000000000000000000000000000000000000000000000000000000";
      expect(block_hash).to.exist;
      const tx = await xpower
        .mint(addresses[0], block_hash, nonce)
        .catch((ex) => {
          const m = ex.message.match(/invalid block-hash/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(tx).to.eq(undefined);
    });
    it("should *not* mint for amount=3 & expired block-hash", async function () {
      const [nonce] = table.getNonce({ amount: 3 });
      expect(nonce.gte(0)).to.eq(true);
      const block_hash =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      expect(block_hash).to.exist;
      const tx = await xpower
        .mint(addresses[0], block_hash, nonce)
        .catch((ex) => {
          const m = ex.message.match(/expired block-hash/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(tx).to.eq(undefined);
    });
  });
  describe("mint & burn", async function () {
    it("should *not* mint for amount=0 & *not* burn 1 token", async function () {
      const [nonce, block_hash] = table.getNonce({ amount: 0 });
      expect(nonce.gte(0)).to.eq(true);
      const tx_mint = await xpower
        .mint(addresses[0], block_hash, nonce)
        .catch((ex) => {
          const m = ex.message.match(/empty nonce-hash/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(tx_mint).to.eq(undefined);
      expect((await xpower.balanceOf(addresses[0])).toBigInt()).to.eq(0n);
      expect((await xpower.balanceOf(addresses[1])).toBigInt()).to.eq(0n);
      const tx_burn = await xpower.burn(1).catch((ex) => {
        const m = ex.message.match(/burn amount exceeds balance/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(tx_burn).to.eq(undefined);
      expect((await xpower.balanceOf(addresses[0])).toBigInt()).to.eq(0n);
      expect((await xpower.balanceOf(addresses[1])).toBigInt()).to.eq(0n);
    });
    it("should *not* mint for amount=0 & *not* burn 2 tokens", async function () {
      const [nonce, block_hash] = table.getNonce({ amount: 0 });
      expect(nonce.gte(0)).to.eq(true);
      const tx_mint = await xpower
        .mint(addresses[0], block_hash, nonce)
        .catch((ex) => {
          const m = ex.message.match(/empty nonce-hash/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(tx_mint).to.eq(undefined);
      expect((await xpower.balanceOf(addresses[0])).toBigInt()).to.eq(0n);
      expect((await xpower.balanceOf(addresses[1])).toBigInt()).to.eq(0n);
      const tx_burn = await xpower.burn(2).catch((ex) => {
        const m = ex.message.match(/burn amount exceeds balance/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(tx_burn).to.eq(undefined);
      expect((await xpower.balanceOf(addresses[0])).toBigInt()).to.eq(0n);
      expect((await xpower.balanceOf(addresses[1])).toBigInt()).to.eq(0n);
    });
    it("should mint for amount=1 & burn 1 token", async function () {
      const [nonce, block_hash] = table.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect((await xpower.balanceOf(addresses[0])).toBigInt()).to.eq(UNIT);
      expect((await xpower.balanceOf(addresses[1])).toBigInt()).to.eq(
        UNIT / 2n
      );
      await xpower.burn(UNIT);
      expect((await xpower.balanceOf(addresses[0])).toBigInt()).to.eq(0n);
      expect((await xpower.balanceOf(addresses[1])).toBigInt()).to.eq(
        UNIT / 2n
      );
    });
    it("should mint for amount=3 & burn 2 tokens", async function () {
      const [nonce, block_hash] = table.getNonce({ amount: 3 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect((await xpower.balanceOf(addresses[0])).toBigInt()).to.eq(
        3n * UNIT
      );
      expect((await xpower.balanceOf(addresses[1])).toBigInt()).to.eq(
        (3n * UNIT) / 2n
      );
      await xpower.burn(2n * UNIT);
      expect((await xpower.balanceOf(addresses[0])).toBigInt()).to.eq(
        1n * UNIT
      );
      expect((await xpower.balanceOf(addresses[1])).toBigInt()).to.eq(
        (3n * UNIT) / 2n
      );
    });
  });
});
