/* eslint no-unused-expressions: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPowerOld; // contract
let XPowerNew; // contract
let xpower_old; // old instance
let xpower_new; // new instance
let UNIT; // decimals

const { HashTable } = require("../hash-table");
let table_0, table_1, table_2; // pre-hashed nonces

const DEADLINE_OLD = 0; // [seconds], i.e. migration not possible
const DEADLINE_NEW = 1_814_400; // [seconds] i.e. 3 weeks

describe("XPowerLoki Migration", async function () {
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
    XPowerOld = await ethers.getContractFactory("XPowerLokiOldTest");
    XPowerNew = await ethers.getContractFactory("XPowerLokiTest");
  });
  beforeEach(async function () {
    // deploy old xpower contract:
    xpower_old = await XPowerOld.deploy([], DEADLINE_OLD);
    await xpower_old.deployed();
    await xpower_old.init();
    // deploy new xpower contract:
    xpower_new = await XPowerNew.deploy([xpower_old.address], DEADLINE_NEW);
    await xpower_new.deployed();
    await xpower_new.init();
  });
  beforeEach(async function () {
    // trigger else-case in XPowerOld.init
    await xpower_old.init();
    // trigger else-case in XPowerNew.init
    await xpower_new.init();
  });
  beforeEach(async function () {
    table_0 = await new HashTable(xpower_old, addresses[0]).init();
    table_1 = await new HashTable(xpower_new, addresses[0]).init();
    table_2 = await new HashTable(xpower_old, addresses[2]).init();
  });
  beforeEach(async function () {
    const old_decimals = await xpower_old.decimals();
    expect(old_decimals).to.eq(0);
    const new_decimals = await xpower_new.decimals();
    expect(new_decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(new_decimals);
    expect(UNIT >= 1n).to.be.true;
  });
  describe("old", async function () {
    it("should mint for amount=1", async function () {
      const [nonce, block_hash] = table_0.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower_old.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_old.balanceOf(addresses[0])).to.eq(1n);
    });
  });
  describe("new", async function () {
    it("should return index=0", async function () {
      const index = await xpower_new.oldIndexOf(xpower_old.address);
      expect(index).to.eq(0);
    });
    it("should mint for amount=1", async function () {
      const [nonce, block_hash] = table_1.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower_new.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_new.balanceOf(addresses[0])).to.eq((3n * UNIT) / 2n);
      expect(await xpower_new.balanceOf(addresses[1])).to.eq(0n);
    });
    it("should approve allowance old[0]", async function () {
      const [nonce, block_hash] = table_0.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower_old.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_old.balanceOf(addresses[0])).to.eq(1n);
      // increase allowance for spender (i.e. XPowerNew)
      const [owner, spender] = [addresses[0], xpower_new.address];
      const old_increase = await xpower_old.increaseAllowance(spender, 1);
      expect(old_increase).to.be.an("object");
      const old_allowance = await xpower_old.allowance(owner, spender);
      expect(old_allowance).to.eq(1n);
      const new_allowance = await xpower_new.allowance(owner, spender);
      expect(new_allowance).to.eq(0n);
    });
    it("should migrate old[0]", async function () {
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
        expect(await xpower_old.balanceOf(minter.address)).to.eq(3n);
        // increase allowance for spender (i.e. XPowerNew)
        const [owner, spender] = [minter.address, xpower_new.address];
        const old_increase = await xpower_old
          .connect(minter)
          .increaseAllowance(spender, 3);
        expect(old_increase).to.be.an("object");
        const old_allowance = await xpower_old.allowance(owner, spender);
        expect(old_allowance).to.eq(3n);
        const new_allowance = await xpower_new.allowance(owner, spender);
        expect(new_allowance).to.eq(0n);
        // migrate amount from old[owner] to new[owner]
        const new_migrate = await xpower_new.connect(minter).migrate(3, [0, 0]);
        expect(new_migrate).to.be.an("object");
        // ensure migrated amount = 3
        const new_migrated = await xpower_new.migrated();
        expect(new_migrated).to.eq(3n * UNIT);
        // ensure old[owner] = 0 & old[spender] = 0
        const old_balance_owner = await xpower_old.balanceOf(owner);
        expect(old_balance_owner).to.eq(0n);
        const old_balance_spender = await xpower_old.balanceOf(spender);
        expect(old_balance_spender).to.eq(0n);
        // ensure new[owner] = 3 & new[spender] = 0
        const new_balance_owner = await xpower_new.balanceOf(owner);
        expect(new_balance_owner).to.eq(3n * UNIT);
        const new_balance_spender = await xpower_new.balanceOf(spender);
        expect(new_balance_spender).to.eq(0n);
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
        expect(await xpower_old.balanceOf(minter.address)).to.eq(2n);
        // increase allowance for spender (i.e. XPowerNew)
        const [owner, spender] = [minter.address, xpower_new.address];
        const old_increase = await xpower_old
          .connect(minter)
          .increaseAllowance(spender, 1);
        expect(old_increase).to.be.an("object");
        const old_allowance = await xpower_old.allowance(owner, spender);
        expect(old_allowance).to.eq(1n);
        const new_allowance = await xpower_new.allowance(owner, spender);
        expect(new_allowance).to.eq(0n);
        // migrate amount from old[owner] to new[owner]
        const new_migrate = await xpower_new.connect(minter).migrate(1, [0, 0]);
        expect(new_migrate).to.be.an("object");
        // ensure migrated amount = 4
        const new_migrated = await xpower_new.migrated();
        expect(new_migrated).to.eq(4n * UNIT);
        // ensure old[owner] = 1 & old[spender] = 0
        const old_balance_owner = await xpower_old.balanceOf(owner);
        expect(old_balance_owner).to.eq(1n);
        const old_balance_spender = await xpower_old.balanceOf(spender);
        expect(old_balance_spender).to.eq(0n);
        // ensure new[owner] = 1 & new[spender] = 0
        const new_balance_owner = await xpower_new.balanceOf(owner);
        expect(new_balance_owner).to.eq(UNIT);
        const new_balance_spender = await xpower_new.balanceOf(spender);
        expect(new_balance_spender).to.eq(0n);
      }
    });
    it("should *but* migrate old[0] = 0 balance", async function () {
      const tx = await xpower_new.migrate(1n, [0, 0]);
      expect(tx).to.be.an("object");
      const new_migrated = await xpower_new.migrated();
      expect(new_migrated).to.eq(0n);
    });
    it("should *not* migrate old[0] (insufficient allowance)", async function () {
      const [nonce, block_hash] = table_0.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower_old.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_old.balanceOf(addresses[0])).to.eq(1n);
      const new_migrate = await xpower_new.migrate(1, [0, 0]).catch((ex) => {
        const m = ex.message.match(/insufficient allowance/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(new_migrate).to.eq(undefined);
      const new_migrated = await xpower_new.migrated();
      expect(new_migrated).to.eq(0n);
    });
    it("should *but* migrate old[0] = 1 balance", async function () {
      const [nonce, block_hash] = table_0.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower_old.mint(addresses[0], block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_old.balanceOf(addresses[0])).to.eq(1n);
      // increase allowance for spender (i.e. XPowerNew)
      const [owner, spender] = [addresses[0], xpower_new.address];
      const old_increase = await xpower_old.increaseAllowance(spender, 5);
      expect(old_increase).to.be.an("object");
      const old_allowance = await xpower_old.allowance(owner, spender);
      expect(old_allowance).to.eq(5);
      const new_allowance = await xpower_new.allowance(owner, spender);
      expect(new_allowance).to.eq(0n);
      // migrate amount from old[owner] to new[owner]
      const new_migrate = await xpower_new.migrate(2n, [0, 0]);
      expect(new_migrate).to.be.an("object");
      // ensure migrated amount = 1 < 2
      const new_migrated = await xpower_new.migrated();
      expect(new_migrated).to.eq(UNIT);
    });
    it("should migrate old[2]", async function () {
      const minter = accounts[2];
      expect(minter.address).to.match(/^0x/);
      const [nonce, block_hash] = table_2.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower_old
        .connect(minter)
        .mint(minter.address, block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_old.balanceOf(minter.address)).to.eq(1n);
      // increase allowance for spender (i.e. XPowerNew)
      const [owner, spender] = [minter.address, xpower_new.address];
      const old_increase = await xpower_old
        .connect(minter)
        .increaseAllowance(spender, 1);
      expect(old_increase).to.be.an("object");
      const old_allowance = await xpower_old.allowance(owner, spender);
      expect(old_allowance).to.eq(1n);
      const new_allowance = await xpower_new.allowance(owner, spender);
      expect(new_allowance).to.eq(0n);
      // migrate amount from old[owner] to new[owner]
      const new_migrate = await xpower_new.connect(minter).migrate(1, [0, 0]);
      expect(new_migrate).to.be.an("object");
      // ensure migrated amount = 1
      const new_migrated = await xpower_new.migrated();
      expect(new_migrated).to.eq(UNIT);
      // ensure old[owner] = 0 & old[spender] = 0
      const old_balance_owner = await xpower_old.balanceOf(owner);
      expect(old_balance_owner).to.eq(0n);
      const old_balance_spender = await xpower_old.balanceOf(spender);
      expect(old_balance_spender).to.eq(0n);
      // ensure new[owner] = 1 & new[spender] = 0
      const new_balance_owner = await xpower_new.balanceOf(owner);
      expect(new_balance_owner).to.eq(UNIT);
      const new_balance_spender = await xpower_new.balanceOf(spender);
      expect(new_balance_spender).to.eq(0n);
    });
    it("should *not* migrate old[2] (migration sealed)", async function () {
      const minter = accounts[2];
      expect(minter.address).to.match(/^0x/);
      const [nonce, block_hash] = table_2.getNonce({ amount: 1 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower_old
        .connect(minter)
        .mint(minter.address, block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_old.balanceOf(minter.address)).to.eq(1n);
      // deploy xpower_new contract (w/o transferring ownership):
      xpower_new = await XPowerNew.deploy([xpower_old.address], DEADLINE_NEW);
      await xpower_new.deployed();
      expect(xpower_new.address).to.exists;
      const { value: block_hash_new } = await xpower_new.connect(minter).init();
      expect(block_hash_new).to.eq(0n);
      // increase allowance for spender (i.e. XPowerNew)
      const [owner, spender] = [minter.address, xpower_new.address];
      const old_increase = await xpower_old
        .connect(minter)
        .increaseAllowance(spender, 1);
      expect(old_increase).to.be.an("object");
      const old_allowance = await xpower_old.allowance(owner, spender);
      expect(old_allowance).to.eq(1n);
      const new_allowance = await xpower_new.allowance(owner, spender);
      expect(new_allowance).to.eq(0n);
      // grant seal role to default account (i.e. deployer)
      await xpower_new.grantRole(xpower_new.MOE_SEAL_ROLE(), addresses[0]);
      // seal migrate option
      expect(await xpower_new.seals()).to.deep.eq([false]);
      await xpower_new.seal(0);
      expect(await xpower_new.seals()).to.deep.eq([true]);
      await xpower_new.sealAll();
      expect(await xpower_new.seals()).to.deep.eq([true]);
      // migrate amount from old[owner] to new[owner]
      const new_migrate = await xpower_new
        .connect(minter)
        .migrate(1, [0, 0])
        .catch((ex) => {
          const m = ex.message.match(/migration sealed/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(new_migrate).to.eq(undefined);
      // ensure migrated amount = 0
      const new_migrated = await xpower_new.migrated();
      expect(new_migrated).to.eq(0n);
    });
    it("should *not* seal new (missing role)", async function () {
      const minter = accounts[2];
      expect(minter.address).to.match(/^0x/);
      // deploy xpower_new contract (w/o transferring ownership):
      xpower_new = await XPowerNew.deploy([xpower_old.address], DEADLINE_NEW);
      await xpower_new.deployed();
      expect(xpower_new.address).to.exists;
      // grant seal role to default account (but *not* minter)
      await xpower_new.grantRole(xpower_new.MOE_SEAL_ROLE(), addresses[0]);
      // try to seal migrate option
      try {
        const new_seal = await xpower_new.connect(minter).seal(0);
        expect(new_seal).to.be.an(undefined);
      } catch (ex) {
        const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      }
    });
    it("should *not* migrate old[2] (deadline passed)", async function () {
      const minter = accounts[2];
      expect(minter.address).to.match(/^0x/);
      const [nonce, block_hash] = table_2.getNonce({ amount: 3 });
      expect(nonce.gte(0)).to.eq(true);
      const tx = await xpower_old
        .connect(minter)
        .mint(minter.address, block_hash, nonce);
      expect(tx).to.be.an("object");
      expect(await xpower_old.balanceOf(minter.address)).to.eq(3n);
      expect(await xpower_old.balanceOf(addresses[0])).to.eq(1n);
      // increase allowance for spender (i.e. XPowerNew)
      const [owner, spender] = [minter.address, xpower_new.address];
      const old_increase = await xpower_old
        .connect(minter)
        .increaseAllowance(spender, 3);
      expect(old_increase).to.be.an("object");
      const old_allowance = await xpower_old.allowance(owner, spender);
      expect(old_allowance).to.eq(3n);
      const new_allowance = await xpower_new.allowance(owner, spender);
      expect(new_allowance).to.eq(0n);
      // forward time by one week (1st increase)
      await network.provider.send("evm_increaseTime", [604_800]);
      // migrate amount from old[owner] to new[owner]
      const new_migrate_1 = await xpower_new.connect(minter).migrate(1, [0, 0]);
      expect(new_migrate_1).to.be.an("object");
      const new_migrated_1 = await xpower_new.migrated();
      expect(new_migrated_1).to.eq(UNIT);
      // forward time by one more week (2nd increase)
      await network.provider.send("evm_increaseTime", [604_800]);
      // migrate amount from old[owner] to new[owner]
      const new_migrate_2 = await xpower_new.connect(minter).migrate(1, [0, 0]);
      expect(new_migrate_2).to.be.an("object");
      const new_migrated_2 = await xpower_new.migrated();
      expect(new_migrated_2).to.eq(2n * UNIT);
      // forward time by one more week (3rd increase)
      await network.provider.send("evm_increaseTime", [604_800]);
      // migrate amount from old[owner] to new[owner]
      const new_migrate_3 = await xpower_new
        .connect(minter)
        .migrate(1, [0, 0])
        .catch((ex) => {
          const m = ex.message.match(/deadline passed/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(new_migrate_3).to.eq(undefined);
      // ensure migrated amount = 2 (and not 3)
      const new_migrated_3 = await xpower_new.migrated();
      expect(new_migrated_3).to.eq(2n * UNIT);
      // ensure old[owner] = 1 & old[spender] = 0
      const old_balance_owner = await xpower_old.balanceOf(owner);
      expect(old_balance_owner).to.eq(1n);
      const old_balance_spender = await xpower_old.balanceOf(spender);
      expect(old_balance_spender).to.eq(0n);
      // ensure new[owner] = 2 & new[spender] = 0
      const new_balance_owner = await xpower_new.balanceOf(owner);
      expect(new_balance_owner).to.eq(2n * UNIT);
      const new_balance_spender = await xpower_new.balanceOf(spender);
      expect(new_balance_spender).to.eq(0n);
    });
  });
});
