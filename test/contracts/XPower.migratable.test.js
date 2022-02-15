/* eslint no-unused-expressions: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contract
let xpower_v1; // old instance
let xpower_v2; // new instance

const { HashTable } = require("../hash-table");
let table_0, table_2; // pre-hashed nonces

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEADLINE_v1 = 0; // [seconds], i.e. migrate not possible
const DEADLINE_v2 = 1_814_400; // [seconds] i.e. 3 weeks

describe("Migration", async function () {
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
    const factory = await ethers.getContractFactory("XPowerGpuTest");
    const contract = await factory.deploy(NULL_ADDRESS, DEADLINE_v1);
    table_0 = await new HashTable(contract, addresses[0]).init();
    table_2 = await new HashTable(contract, addresses[2]).init();
  });
  before(async function () {
    XPower = await ethers.getContractFactory("XPowerGpuTest");
  });
  beforeEach(async function () {
    // deploy xpower.v1 contract:
    xpower_v1 = await XPower.deploy(NULL_ADDRESS, DEADLINE_v1);
    await xpower_v1.deployed();
    expect(xpower_v1.address).to.be.a("string");
    const init_v1 = await xpower_v1.init();
    expect(init_v1).to.be.an("object");
    // deploy xpower.v2 contract:
    xpower_v2 = await XPower.deploy(xpower_v1.address, DEADLINE_v2);
    await xpower_v2.deployed();
    expect(xpower_v2.address).to.exists;
    const init_v2 = await xpower_v2.init();
    expect(init_v2).to.be.an("object");
  });
  describe("v1", async function () {
    it("should mint for amount=1", async function () {
      const [nonce, block_hash] = table_0.getNonce({ amount: 1 });
      expect(nonce).to.greaterThanOrEqual(0);
      const tx = await xpower_v1.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_v1.balanceOf(addresses[0])).to.eq(1);
    });
  });
  describe("v2", async function () {
    it("should mint for amount=1", async function () {
      const [nonce, block_hash] = table_0.getNonce({ amount: 1 });
      expect(nonce).to.greaterThanOrEqual(0);
      const tx = await xpower_v2.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_v2.balanceOf(addresses[0])).to.eq(1);
      expect(await xpower_v2.balanceOf(addresses[1])).to.eq(0);
    });
    it("should approve allowance v1[0] => v2", async function () {
      const [nonce, block_hash] = table_0.getNonce({ amount: 1 });
      expect(nonce).to.greaterThanOrEqual(0);
      const tx = await xpower_v1.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_v1.balanceOf(addresses[0])).to.eq(1);
      // increase allowance for spender (i.e. XPower.v2)
      const [owner, spender] = [addresses[0], xpower_v2.address];
      const v1_increase = await xpower_v1.increaseAllowance(spender, 1);
      expect(v1_increase).to.be.an("object");
      const v1_allowance = await xpower_v1.allowance(owner, spender);
      expect(v1_allowance.toNumber()).to.eq(1);
      const v2_allowance = await xpower_v2.allowance(owner, spender);
      expect(v2_allowance.toNumber()).to.eq(0);
    });
    it("should migrate v1[0] => v2", async function () {
      //
      // migrate for minter #2
      //
      {
        const minter = accounts[2];
        expect(minter.address).to.match(/^0x/);
        const [nonce, block_hash] = table_2.getNonce({ amount: 3 });
        expect(nonce).to.greaterThanOrEqual(0);
        const tx = await xpower_v1
          .connect(minter)
          .mint(minter.address, block_hash, nonce);
        expect(tx).to.be.an("object");
        expect(await xpower_v1.balanceOf(minter.address)).to.eq(3);
        // increase allowance for spender (i.e. XPower.v2)
        const [owner, spender] = [minter.address, xpower_v2.address];
        const v1_increase = await xpower_v1
          .connect(minter)
          .increaseAllowance(spender, 3);
        expect(v1_increase).to.be.an("object");
        const v1_allowance = await xpower_v1.allowance(owner, spender);
        expect(v1_allowance.toNumber()).to.eq(3);
        const v2_allowance = await xpower_v2.allowance(owner, spender);
        expect(v2_allowance.toNumber()).to.eq(0);
        // migrate amount from v1[owner] to v2[owner]
        const v2_migrate = await xpower_v2.connect(minter).migrate(3);
        expect(v2_migrate).to.be.an("object");
        // ensure migrated amount = 3
        const v2_migrated = await xpower_v2.migrated();
        expect(v2_migrated).to.eq(3);
        // ensure v1[owner] = 0 & v1[spender] = 0
        const v1_balance_owner = await xpower_v1.balanceOf(owner);
        expect(v1_balance_owner.toNumber()).to.eq(0);
        const v1_balance_spender = await xpower_v1.balanceOf(spender);
        expect(v1_balance_spender.toNumber()).to.eq(0);
        // ensure v2[owner] = 3 & v2[spender] = 0
        const v2_balance_owner = await xpower_v2.balanceOf(owner);
        expect(v2_balance_owner.toNumber()).to.eq(3);
        const v2_balance_spender = await xpower_v2.balanceOf(spender);
        expect(v2_balance_spender.toNumber()).to.eq(0);
      }
      //
      // migrate for minter #0 (project fund)
      //
      {
        const minter = accounts[0];
        expect(minter.address).to.match(/^0x/);
        const [nonce, block_hash] = table_0.getNonce({ amount: 1 });
        expect(nonce).to.greaterThanOrEqual(0);
        const tx = await xpower_v1
          .connect(minter)
          .mint(minter.address, block_hash, nonce);
        expect(tx).to.be.an("object");
        expect(await xpower_v1.balanceOf(minter.address)).to.eq(2);
        // increase allowance for spender (i.e. XPower.v2)
        const [owner, spender] = [minter.address, xpower_v2.address];
        const v1_increase = await xpower_v1
          .connect(minter)
          .increaseAllowance(spender, 1);
        expect(v1_increase).to.be.an("object");
        const v1_allowance = await xpower_v1.allowance(owner, spender);
        expect(v1_allowance.toNumber()).to.eq(1);
        const v2_allowance = await xpower_v2.allowance(owner, spender);
        expect(v2_allowance.toNumber()).to.eq(0);
        // migrate amount from v1[owner] to v2[owner]
        const v2_migrate = await xpower_v2.connect(minter).migrate(1);
        expect(v2_migrate).to.be.an("object");
        // ensure migrated amount = 4
        const v2_migrated = await xpower_v2.migrated();
        expect(v2_migrated).to.eq(4);
        // ensure v1[owner] = 1 & v1[spender] = 0
        const v1_balance_owner = await xpower_v1.balanceOf(owner);
        expect(v1_balance_owner.toNumber()).to.eq(1);
        const v1_balance_spender = await xpower_v1.balanceOf(spender);
        expect(v1_balance_spender.toNumber()).to.eq(0);
        // ensure v2[owner] = 1 & v2[spender] = 0
        const v2_balance_owner = await xpower_v2.balanceOf(owner);
        expect(v2_balance_owner.toNumber()).to.eq(1);
        const v2_balance_spender = await xpower_v2.balanceOf(spender);
        expect(v2_balance_spender.toNumber()).to.eq(0);
      }
    });
    it("should *not* migrate v1[0] => v2 (insufficient allowance: v1[0] = 0 balance)", async function () {
      const tx = await xpower_v2.migrate(1).catch((ex) => {
        const m = ex.message.match(/insufficient allowance/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(tx).to.eq(undefined);
      const v2_migrated = await xpower_v2.migrated();
      expect(v2_migrated).to.eq(0);
    });
    it("should *not* migrate v1[0] => v2 (insufficient allowance)", async function () {
      const [nonce, block_hash] = table_0.getNonce({ amount: 1 });
      expect(nonce).to.greaterThanOrEqual(0);
      const tx = await xpower_v1.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_v1.balanceOf(addresses[0])).to.eq(1);
      const v2_migrate = await xpower_v2.migrate(1).catch((ex) => {
        const m = ex.message.match(/insufficient allowance/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(v2_migrate).to.eq(undefined);
      const v2_migrated = await xpower_v2.migrated();
      expect(v2_migrated).to.eq(0);
    });
    it("should *not* migrate v1[0] => v2 (insufficient balance)", async function () {
      const [nonce, block_hash] = table_0.getNonce({ amount: 1 });
      expect(nonce).to.greaterThanOrEqual(0);
      const tx = await xpower_v1.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_v1.balanceOf(addresses[0])).to.eq(1);
      // increase allowance for spender (i.e. XPower.v2)
      const [owner, spender] = [addresses[0], xpower_v2.address];
      const v1_increase = await xpower_v1.increaseAllowance(spender, 5);
      expect(v1_increase).to.be.an("object");
      const v1_allowance = await xpower_v1.allowance(owner, spender);
      expect(v1_allowance.toNumber()).to.eq(5);
      const v2_allowance = await xpower_v2.allowance(owner, spender);
      expect(v2_allowance.toNumber()).to.eq(0);
      // migrate amount from v1[owner] to v2[owner]
      const v2_migrate = await xpower_v2.migrate(5).catch((ex) => {
        const m = ex.message.match(/insufficient balance/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(v2_migrate).to.eq(undefined);
      // ensure migrated amount = 0
      const v2_migrated = await xpower_v2.migrated();
      expect(v2_migrated).to.eq(0);
    });
    it("should migrate v1[2] => v2", async function () {
      const minter = accounts[2];
      expect(minter.address).to.match(/^0x/);
      const [nonce, block_hash] = table_2.getNonce({ amount: 1 });
      expect(nonce).to.greaterThanOrEqual(0);
      const tx = await xpower_v1
        .connect(minter)
        .mint(minter.address, block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_v1.balanceOf(minter.address)).to.eq(1);
      // increase allowance for spender (i.e. XPower.v2)
      const [owner, spender] = [minter.address, xpower_v2.address];
      const v1_increase = await xpower_v1
        .connect(minter)
        .increaseAllowance(spender, 1);
      expect(v1_increase).to.be.an("object");
      const v1_allowance = await xpower_v1.allowance(owner, spender);
      expect(v1_allowance.toNumber()).to.eq(1);
      const v2_allowance = await xpower_v2.allowance(owner, spender);
      expect(v2_allowance.toNumber()).to.eq(0);
      // migrate amount from v1[owner] to v2[owner]
      const v2_migrate = await xpower_v2.connect(minter).migrate(1);
      expect(v2_migrate).to.be.an("object");
      // ensure migrated amount = 1
      const v2_migrated = await xpower_v2.migrated();
      expect(v2_migrated).to.eq(1);
      // ensure v1[owner] = 0 & v1[spender] = 0
      const v1_balance_owner = await xpower_v1.balanceOf(owner);
      expect(v1_balance_owner.toNumber()).to.eq(0);
      const v1_balance_spender = await xpower_v1.balanceOf(spender);
      expect(v1_balance_spender.toNumber()).to.eq(0);
      // ensure v2[owner] = 1 & v2[spender] = 0
      const v2_balance_owner = await xpower_v2.balanceOf(owner);
      expect(v2_balance_owner.toNumber()).to.eq(1);
      const v2_balance_spender = await xpower_v2.balanceOf(spender);
      expect(v2_balance_spender.toNumber()).to.eq(0);
    });
    it("should *not* migrate v1[2] => v2 (migration sealed)", async function () {
      const minter = accounts[2];
      expect(minter.address).to.match(/^0x/);
      const [nonce, block_hash] = table_2.getNonce({ amount: 1 });
      expect(nonce).to.greaterThanOrEqual(0);
      const tx = await xpower_v1
        .connect(minter)
        .mint(minter.address, block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_v1.balanceOf(minter.address)).to.eq(1);
      // deploy xpower.v2 contract (w/o transferring ownership):
      xpower_v2 = await XPower.deploy(xpower_v1.address, DEADLINE_v2);
      await xpower_v2.deployed();
      expect(xpower_v2.address).to.exists;
      const { value: block_hash_v2 } = await xpower_v2.connect(minter).init();
      expect(block_hash_v2.toNumber()).to.eq(0);
      // increase allowance for spender (i.e. XPower.v2)
      const [owner, spender] = [minter.address, xpower_v2.address];
      const v1_increase = await xpower_v1
        .connect(minter)
        .increaseAllowance(spender, 1);
      expect(v1_increase).to.be.an("object");
      const v1_allowance = await xpower_v1.allowance(owner, spender);
      expect(v1_allowance.toNumber()).to.eq(1);
      const v2_allowance = await xpower_v2.allowance(owner, spender);
      expect(v2_allowance.toNumber()).to.eq(0);
      // seal migrate option
      const v2_seal = await xpower_v2.seal();
      expect(v2_seal).to.be.an("object");
      // migrate amount from v1[owner] to v2[owner]
      const v2_migrate = await xpower_v2
        .connect(minter)
        .migrate(1)
        .catch((ex) => {
          const m = ex.message.match(/migration sealed/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(v2_migrate).to.eq(undefined);
      // ensure migrated amount = 0
      const v2_migrated = await xpower_v2.migrated();
      expect(v2_migrated).to.eq(0);
    });
    it("should *not* migrate v1[2] => v2 (deadline passed)", async function () {
      const minter = accounts[2];
      expect(minter.address).to.match(/^0x/);
      const [nonce, block_hash] = table_2.getNonce({ amount: 3 });
      expect(nonce).to.greaterThanOrEqual(0);
      const tx = await xpower_v1
        .connect(minter)
        .mint(minter.address, block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_v1.balanceOf(minter.address)).to.eq(3);
      expect(await xpower_v1.balanceOf(addresses[0])).to.eq(1);
      // increase allowance for spender (i.e. XPower.v2)
      const [owner, spender] = [minter.address, xpower_v2.address];
      const v1_increase = await xpower_v1
        .connect(minter)
        .increaseAllowance(spender, 3);
      expect(v1_increase).to.be.an("object");
      const v1_allowance = await xpower_v1.allowance(owner, spender);
      expect(v1_allowance.toNumber()).to.eq(3);
      const v2_allowance = await xpower_v2.allowance(owner, spender);
      expect(v2_allowance.toNumber()).to.eq(0);
      // forward time by one week (1st increase)
      await network.provider.send("evm_increaseTime", [604_800]);
      // migrate amount from v1[owner] to v2[owner]
      const v2_migrate_1 = await xpower_v2.connect(minter).migrate(1);
      expect(v2_migrate_1).to.be.an("object");
      const v2_migrated_1 = await xpower_v2.migrated();
      expect(v2_migrated_1).to.eq(1);
      // forward time by one more week (2nd increase)
      await network.provider.send("evm_increaseTime", [604_800]);
      // migrate amount from v1[owner] to v2[owner]
      const v2_migrate_2 = await xpower_v2.connect(minter).migrate(1);
      expect(v2_migrate_2).to.be.an("object");
      const v2_migrated_2 = await xpower_v2.migrated();
      expect(v2_migrated_2).to.eq(2);
      // forward time by one more week (3rd increase)
      await network.provider.send("evm_increaseTime", [604_800]);
      // migrate amount from v1[owner] to v2[owner]
      const v2_migrate_3 = await xpower_v2
        .connect(minter)
        .migrate(1)
        .catch((ex) => {
          const m = ex.message.match(/deadline passed/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(v2_migrate_3).to.eq(undefined);
      // ensure migrated amount = 2 (and not 3)
      const v2_migrated_3 = await xpower_v2.migrated();
      expect(v2_migrated_3).to.eq(2);
      // ensure v1[owner] = 1 & v1[spender] = 0
      const v1_balance_owner = await xpower_v1.balanceOf(owner);
      expect(v1_balance_owner.toNumber()).to.eq(1);
      const v1_balance_spender = await xpower_v1.balanceOf(spender);
      expect(v1_balance_spender.toNumber()).to.eq(0);
      // ensure v2[owner] = 2 & v2[spender] = 0
      const v2_balance_owner = await xpower_v2.balanceOf(owner);
      expect(v2_balance_owner.toNumber()).to.eq(2);
      const v2_balance_spender = await xpower_v2.balanceOf(spender);
      expect(v2_balance_spender.toNumber()).to.eq(0);
    });
    it("should *not* seal (caller is not the owner)", async function () {
      const minter = accounts[2];
      expect(minter.address).to.match(/^0x/);
      // deploy xpower.v2 contract (w/o transferring ownership):
      xpower_v2 = await XPower.deploy(xpower_v1.address, DEADLINE_v2);
      await xpower_v2.deployed();
      expect(xpower_v2.address).to.exists;
      // try to seal migrate option
      try {
        const v2_seal = await xpower_v2.connect(minter).seal();
        expect(v2_seal).to.be.an(undefined);
      } catch (ex) {
        const m = ex.message.match(/caller is not the owner/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      }
    });
  });
});
