/* eslint no-unused-expressions: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contract
let xpower_old; // old instance
let xpower_new; // new instance

const { HashTable } = require("../hash-table");
let table_0, table_2; // pre-hashed nonces

const NONE_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEADLINE_OLD = 0; // [seconds], i.e. migration not possible
const DEADLINE_NEW = 1_814_400; // [seconds] i.e. 3 weeks

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
    const factory = await ethers.getContractFactory("XPowerAqchTest");
    const contract = await factory.deploy(NONE_ADDRESS, DEADLINE_OLD);
    table_0 = await new HashTable(contract, addresses[0]).init();
    table_2 = await new HashTable(contract, addresses[2]).init();
  });
  before(async function () {
    XPower = await ethers.getContractFactory("XPowerAqchTest");
  });
  beforeEach(async function () {
    // deploy old xpower contract:
    xpower_old = await XPower.deploy(NONE_ADDRESS, DEADLINE_OLD);
    await xpower_old.deployed();
    await xpower_old.init();
    // deploy new xpower contract:
    xpower_new = await XPower.deploy(xpower_old.address, DEADLINE_NEW);
    await xpower_new.deployed();
    await xpower_new.init();
  });
  describe("old", async function () {
    it("should mint for amount=1", async function () {
      const [nonce, block_hash] = table_0.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower_old.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_old.balanceOf(addresses[0])).to.eq(1);
    });
  });
  describe("new", async function () {
    it("should mint for amount=1", async function () {
      const [nonce, block_hash] = table_0.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower_new.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_new.balanceOf(addresses[0])).to.eq(1);
      expect(await xpower_new.balanceOf(addresses[1])).to.eq(0);
    });
    it("should approve allowance old[0] => new", async function () {
      const [nonce, block_hash] = table_0.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower_old.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_old.balanceOf(addresses[0])).to.eq(1);
      // increase allowance for spender (i.e. XPower.new)
      const [owner, spender] = [addresses[0], xpower_new.address];
      const old_increase = await xpower_old.increaseAllowance(spender, 1);
      expect(old_increase).to.be.an("object");
      const old_allowance = await xpower_old.allowance(owner, spender);
      expect(old_allowance.toNumber()).to.eq(1);
      const new_allowance = await xpower_new.allowance(owner, spender);
      expect(new_allowance.toNumber()).to.eq(0);
    });
    it("should migrate old[0] => new", async function () {
      //
      // migrate for minter #2
      //
      {
        const minter = accounts[2];
        expect(minter.address).to.match(/^0x/);
        const [nonce, block_hash] = table_2.getNonce({ amount: 3 });
        expect(nonce.gte(0)).to.eq(true);
        const tx = await xpower_old
          .connect(minter)
          .mint(minter.address, block_hash, nonce);
        expect(tx).to.be.an("object");
        expect(await xpower_old.balanceOf(minter.address)).to.eq(3);
        // increase allowance for spender (i.e. XPower.new)
        const [owner, spender] = [minter.address, xpower_new.address];
        const old_increase = await xpower_old
          .connect(minter)
          .increaseAllowance(spender, 3);
        expect(old_increase).to.be.an("object");
        const old_allowance = await xpower_old.allowance(owner, spender);
        expect(old_allowance.toNumber()).to.eq(3);
        const new_allowance = await xpower_new.allowance(owner, spender);
        expect(new_allowance.toNumber()).to.eq(0);
        // migrate amount from old[owner] to new[owner]
        const new_migrate = await xpower_new.connect(minter).migrate(3);
        expect(new_migrate).to.be.an("object");
        // ensure migrated amount = 3
        const new_migrated = await xpower_new.migrated();
        expect(new_migrated).to.eq(3);
        // ensure old[owner] = 0 & old[spender] = 0
        const old_balance_owner = await xpower_old.balanceOf(owner);
        expect(old_balance_owner.toNumber()).to.eq(0);
        const old_balance_spender = await xpower_old.balanceOf(spender);
        expect(old_balance_spender.toNumber()).to.eq(0);
        // ensure new[owner] = 3 & new[spender] = 0
        const new_balance_owner = await xpower_new.balanceOf(owner);
        expect(new_balance_owner.toNumber()).to.eq(3);
        const new_balance_spender = await xpower_new.balanceOf(spender);
        expect(new_balance_spender.toNumber()).to.eq(0);
      }
      //
      // migrate for minter #0 (project fund)
      //
      {
        const minter = accounts[0];
        expect(minter.address).to.match(/^0x/);
        const [nonce, block_hash] = table_0.getNonce({ amount: 1 });
        expect(nonce.gte(0)).to.eq(true);
        const tx = await xpower_old
          .connect(minter)
          .mint(minter.address, block_hash, nonce);
        expect(tx).to.be.an("object");
        expect(await xpower_old.balanceOf(minter.address)).to.eq(2);
        // increase allowance for spender (i.e. XPower.new)
        const [owner, spender] = [minter.address, xpower_new.address];
        const old_increase = await xpower_old
          .connect(minter)
          .increaseAllowance(spender, 1);
        expect(old_increase).to.be.an("object");
        const old_allowance = await xpower_old.allowance(owner, spender);
        expect(old_allowance.toNumber()).to.eq(1);
        const new_allowance = await xpower_new.allowance(owner, spender);
        expect(new_allowance.toNumber()).to.eq(0);
        // migrate amount from old[owner] to new[owner]
        const new_migrate = await xpower_new.connect(minter).migrate(1);
        expect(new_migrate).to.be.an("object");
        // ensure migrated amount = 4
        const new_migrated = await xpower_new.migrated();
        expect(new_migrated).to.eq(4);
        // ensure old[owner] = 1 & old[spender] = 0
        const old_balance_owner = await xpower_old.balanceOf(owner);
        expect(old_balance_owner.toNumber()).to.eq(1);
        const old_balance_spender = await xpower_old.balanceOf(spender);
        expect(old_balance_spender.toNumber()).to.eq(0);
        // ensure new[owner] = 1 & new[spender] = 0
        const new_balance_owner = await xpower_new.balanceOf(owner);
        expect(new_balance_owner.toNumber()).to.eq(1);
        const new_balance_spender = await xpower_new.balanceOf(spender);
        expect(new_balance_spender.toNumber()).to.eq(0);
      }
    });
    it("should *not* migrate old[0] => new (insufficient allowance: old[0] = 0 balance)", async function () {
      const tx = await xpower_new.migrate(1).catch((ex) => {
        const m = ex.message.match(/insufficient allowance/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(tx).to.eq(undefined);
      const new_migrated = await xpower_new.migrated();
      expect(new_migrated).to.eq(0);
    });
    it("should *not* migrate old[0] => new (insufficient allowance)", async function () {
      const [nonce, block_hash] = table_0.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower_old.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_old.balanceOf(addresses[0])).to.eq(1);
      const new_migrate = await xpower_new.migrate(1).catch((ex) => {
        const m = ex.message.match(/insufficient allowance/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(new_migrate).to.eq(undefined);
      const new_migrated = await xpower_new.migrated();
      expect(new_migrated).to.eq(0);
    });
    it("should *not* migrate old[0] => new (insufficient balance)", async function () {
      const [nonce, block_hash] = table_0.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower_old.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_old.balanceOf(addresses[0])).to.eq(1);
      // increase allowance for spender (i.e. XPower.new)
      const [owner, spender] = [addresses[0], xpower_new.address];
      const old_increase = await xpower_old.increaseAllowance(spender, 5);
      expect(old_increase).to.be.an("object");
      const old_allowance = await xpower_old.allowance(owner, spender);
      expect(old_allowance.toNumber()).to.eq(5);
      const new_allowance = await xpower_new.allowance(owner, spender);
      expect(new_allowance.toNumber()).to.eq(0);
      // migrate amount from old[owner] to new[owner]
      const new_migrate = await xpower_new.migrate(5).catch((ex) => {
        const m = ex.message.match(/insufficient balance/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(new_migrate).to.eq(undefined);
      // ensure migrated amount = 0
      const new_migrated = await xpower_new.migrated();
      expect(new_migrated).to.eq(0);
    });
    it("should migrate old[2] => new", async function () {
      const minter = accounts[2];
      expect(minter.address).to.match(/^0x/);
      const [nonce, block_hash] = table_2.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower_old
        .connect(minter)
        .mint(minter.address, block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_old.balanceOf(minter.address)).to.eq(1);
      // increase allowance for spender (i.e. XPower.new)
      const [owner, spender] = [minter.address, xpower_new.address];
      const old_increase = await xpower_old
        .connect(minter)
        .increaseAllowance(spender, 1);
      expect(old_increase).to.be.an("object");
      const old_allowance = await xpower_old.allowance(owner, spender);
      expect(old_allowance.toNumber()).to.eq(1);
      const new_allowance = await xpower_new.allowance(owner, spender);
      expect(new_allowance.toNumber()).to.eq(0);
      // migrate amount from old[owner] to new[owner]
      const new_migrate = await xpower_new.connect(minter).migrate(1);
      expect(new_migrate).to.be.an("object");
      // ensure migrated amount = 1
      const new_migrated = await xpower_new.migrated();
      expect(new_migrated).to.eq(1);
      // ensure old[owner] = 0 & old[spender] = 0
      const old_balance_owner = await xpower_old.balanceOf(owner);
      expect(old_balance_owner.toNumber()).to.eq(0);
      const old_balance_spender = await xpower_old.balanceOf(spender);
      expect(old_balance_spender.toNumber()).to.eq(0);
      // ensure new[owner] = 1 & new[spender] = 0
      const new_balance_owner = await xpower_new.balanceOf(owner);
      expect(new_balance_owner.toNumber()).to.eq(1);
      const new_balance_spender = await xpower_new.balanceOf(spender);
      expect(new_balance_spender.toNumber()).to.eq(0);
    });
    it("should *not* migrate old[2] => new (migration sealed)", async function () {
      const minter = accounts[2];
      expect(minter.address).to.match(/^0x/);
      const [nonce, block_hash] = table_2.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower_old
        .connect(minter)
        .mint(minter.address, block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_old.balanceOf(minter.address)).to.eq(1);
      // deploy xpower.new contract (w/o transferring ownership):
      xpower_new = await XPower.deploy(xpower_old.address, DEADLINE_NEW);
      await xpower_new.deployed();
      expect(xpower_new.address).to.exists;
      const { value: block_hash_new } = await xpower_new.connect(minter).init();
      expect(block_hash_new.toNumber()).to.eq(0);
      // increase allowance for spender (i.e. XPower.new)
      const [owner, spender] = [minter.address, xpower_new.address];
      const old_increase = await xpower_old
        .connect(minter)
        .increaseAllowance(spender, 1);
      expect(old_increase).to.be.an("object");
      const old_allowance = await xpower_old.allowance(owner, spender);
      expect(old_allowance.toNumber()).to.eq(1);
      const new_allowance = await xpower_new.allowance(owner, spender);
      expect(new_allowance.toNumber()).to.eq(0);
      // seal migrate option
      const new_seal = await xpower_new.seal();
      expect(new_seal).to.be.an("object");
      // migrate amount from old[owner] to new[owner]
      const new_migrate = await xpower_new
        .connect(minter)
        .migrate(1)
        .catch((ex) => {
          const m = ex.message.match(/migration sealed/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(new_migrate).to.eq(undefined);
      // ensure migrated amount = 0
      const new_migrated = await xpower_new.migrated();
      expect(new_migrated).to.eq(0);
    });
    it("should *not* migrate old[2] => new (deadline passed)", async function () {
      const minter = accounts[2];
      expect(minter.address).to.match(/^0x/);
      const [nonce, block_hash] = table_2.getNonce({ amount: 3 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower_old
        .connect(minter)
        .mint(minter.address, block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_old.balanceOf(minter.address)).to.eq(3);
      expect(await xpower_old.balanceOf(addresses[0])).to.eq(1);
      // increase allowance for spender (i.e. XPower.new)
      const [owner, spender] = [minter.address, xpower_new.address];
      const old_increase = await xpower_old
        .connect(minter)
        .increaseAllowance(spender, 3);
      expect(old_increase).to.be.an("object");
      const old_allowance = await xpower_old.allowance(owner, spender);
      expect(old_allowance.toNumber()).to.eq(3);
      const new_allowance = await xpower_new.allowance(owner, spender);
      expect(new_allowance.toNumber()).to.eq(0);
      // forward time by one week (1st increase)
      await network.provider.send("evm_increaseTime", [604_800]);
      // migrate amount from old[owner] to new[owner]
      const new_migrate_1 = await xpower_new.connect(minter).migrate(1);
      expect(new_migrate_1).to.be.an("object");
      const new_migrated_1 = await xpower_new.migrated();
      expect(new_migrated_1).to.eq(1);
      // forward time by one more week (2nd increase)
      await network.provider.send("evm_increaseTime", [604_800]);
      // migrate amount from old[owner] to new[owner]
      const new_migrate_2 = await xpower_new.connect(minter).migrate(1);
      expect(new_migrate_2).to.be.an("object");
      const new_migrated_2 = await xpower_new.migrated();
      expect(new_migrated_2).to.eq(2);
      // forward time by one more week (3rd increase)
      await network.provider.send("evm_increaseTime", [604_800]);
      // migrate amount from old[owner] to new[owner]
      const new_migrate_3 = await xpower_new
        .connect(minter)
        .migrate(1)
        .catch((ex) => {
          const m = ex.message.match(/deadline passed/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(new_migrate_3).to.eq(undefined);
      // ensure migrated amount = 2 (and not 3)
      const new_migrated_3 = await xpower_new.migrated();
      expect(new_migrated_3).to.eq(2);
      // ensure old[owner] = 1 & old[spender] = 0
      const old_balance_owner = await xpower_old.balanceOf(owner);
      expect(old_balance_owner.toNumber()).to.eq(1);
      const old_balance_spender = await xpower_old.balanceOf(spender);
      expect(old_balance_spender.toNumber()).to.eq(0);
      // ensure new[owner] = 2 & new[spender] = 0
      const new_balance_owner = await xpower_new.balanceOf(owner);
      expect(new_balance_owner.toNumber()).to.eq(2);
      const new_balance_spender = await xpower_new.balanceOf(spender);
      expect(new_balance_spender.toNumber()).to.eq(0);
    });
    it("should *not* seal (caller is not the owner)", async function () {
      const minter = accounts[2];
      expect(minter.address).to.match(/^0x/);
      // deploy xpower.new contract (w/o transferring ownership):
      xpower_new = await XPower.deploy(xpower_old.address, DEADLINE_NEW);
      await xpower_new.deployed();
      expect(xpower_new.address).to.exists;
      // try to seal migrate option
      try {
        const new_seal = await xpower_new.connect(minter).seal();
        expect(new_seal).to.be.an(undefined);
      } catch (ex) {
        const m = ex.message.match(/caller is not the owner/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      }
    });
  });
});
