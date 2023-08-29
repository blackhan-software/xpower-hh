const { ethers, network } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let MoeOld; // contract
let MoeNew; // contract
let moe_old; // old instance
let moe_new; // new instance
let UNIT; // decimals

const DEADLINE_OLD = 0; // [seconds], i.e. migration not possible
const DEADLINE_NEW = 126_230_400; // [seconds] i.e. 4 years

describe("XPower Migration", async function () {
  before(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
    addresses = accounts.map((acc) => acc.address);
    expect(addresses.length).to.be.greaterThan(1);
  });
  before(async function () {
    MoeOld = await ethers.getContractFactory("XPowerOldTest");
    MoeNew = await ethers.getContractFactory("XPowerTest");
  });
  beforeEach(async function () {
    // deploy old xpower contract:
    moe_old = await MoeOld.deploy([], DEADLINE_OLD);
    await moe_old.init();
    // deploy new xpower contract:
    moe_new = await MoeNew.deploy([moe_old.target], DEADLINE_NEW);
    await moe_new.init();
  });
  beforeEach(async function () {
    // trigger else-case in XPowerOld.init
    await moe_old.init();
    // trigger else-case in XPowerNew.init
    await moe_new.init();
  });
  beforeEach(async function () {
    const old_decimals = await moe_old.decimals();
    expect(old_decimals).to.eq(0);
    const new_decimals = await moe_new.decimals();
    expect(new_decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(new_decimals);
    expect(UNIT >= 1n).to.eq(true);
  });
  describe("old", async function () {
    it("should mint for amount=1", async function () {
      const tx = await moe_old.fake(addresses[0], UNIT);
      expect(tx).to.be.an("object");
      expect(await moe_old.balanceOf(addresses[0])).to.eq(UNIT + UNIT * 2n);
    });
  });
  describe("new", async function () {
    it("should return index=0", async function () {
      const index = await moe_new.oldIndexOf(moe_old.target);
      expect(index).to.eq(0);
    });
    it("should mint for amount=1", async function () {
      const tx = await moe_new.fake(addresses[0], UNIT);
      expect(tx).to.be.an("object");
      expect(await moe_new.balanceOf(addresses[0])).to.eq(UNIT + UNIT * 2n);
    });
    it("should approve allowance old[1]", async function () {
      const tx = await moe_old.fake(addresses[0], UNIT);
      expect(tx).to.be.an("object");
      expect(await moe_old.balanceOf(addresses[0])).to.eq(UNIT + UNIT * 2n);
      // increase allowance for spender (i.e. XPowerNew)
      const [owner, spender] = [addresses[0], moe_new.target];
      const old_increase = await moe_old.increaseAllowance(spender, UNIT);
      expect(old_increase).to.be.an("object");
      const old_allowance = await moe_old.allowance(owner, spender);
      expect(old_allowance).to.eq(UNIT);
      const new_allowance = await moe_new.allowance(owner, spender);
      expect(new_allowance).to.eq(0n);
    });
    it("should migrate old[0]", async function () {
      //
      // migrate for minter #2
      //
      {
        const minter = accounts[2];
        expect(minter.address).to.match(/^0x/);
        const tx = await moe_old.connect(minter).fake(minter.address, 3n);
        expect(tx).to.be.an("object");
        expect(await moe_old.balanceOf(minter.address)).to.eq(3n);
        // increase allowance for spender (i.e. XPowerNew)
        const [owner, spender] = [minter.address, moe_new.target];
        const old_increase = await moe_old
          .connect(minter)
          .increaseAllowance(spender, 3n);
        expect(old_increase).to.be.an("object");
        const old_allowance = await moe_old.allowance(owner, spender);
        expect(old_allowance).to.eq(3n);
        const new_allowance = await moe_new.allowance(owner, spender);
        expect(new_allowance).to.eq(0n);
        // migrate amount from old[owner] to new[owner]
        const new_migrate = await moe_new.connect(minter).migrate(3n, [0, 0]);
        expect(new_migrate).to.be.an("object");
        // ensure migrated amount = 3
        const new_migrated = await moe_new.migrated();
        expect(new_migrated).to.eq(3n * UNIT);
        // ensure old[owner] = 0 & old[spender] = 0
        const old_balance_owner = await moe_old.balanceOf(owner);
        expect(old_balance_owner).to.eq(0n);
        const old_balance_spender = await moe_old.balanceOf(spender);
        expect(old_balance_spender).to.eq(0n);
        // ensure new[owner] = 3 & new[spender] = 0
        const new_balance_owner = await moe_new.balanceOf(owner);
        expect(new_balance_owner).to.eq(3n * UNIT);
        const new_balance_spender = await moe_new.balanceOf(spender);
        expect(new_balance_spender).to.eq(0n);
      }
      //
      // migrate for minter #0 (project fund)
      //
      {
        const minter = accounts[0];
        expect(minter.address).to.match(/^0x/);
        const tx = await moe_old.connect(minter).fake(minter.address, 1n);
        expect(tx).to.be.an("object");
        expect(await moe_old.balanceOf(minter.address)).to.eq(9n);
        // increase allowance for spender (i.e. XPowerNew)
        const [owner, spender] = [minter.address, moe_new.target];
        const old_increase = await moe_old
          .connect(minter)
          .increaseAllowance(spender, 1n);
        expect(old_increase).to.be.an("object");
        const old_allowance = await moe_old.allowance(owner, spender);
        expect(old_allowance).to.eq(1n);
        const new_allowance = await moe_new.allowance(owner, spender);
        expect(new_allowance).to.eq(0n);
        // migrate amount from old[owner] to new[owner]
        const new_migrate = await moe_new.connect(minter).migrate(1n, [0, 0]);
        expect(new_migrate).to.be.an("object");
        // ensure migrated amount = 4
        const new_migrated = await moe_new.migrated();
        expect(new_migrated).to.eq(4n * UNIT);
        // ensure old[owner] = 1 & old[spender] = 0
        const old_balance_owner = await moe_old.balanceOf(owner);
        expect(old_balance_owner).to.eq(8n);
        const old_balance_spender = await moe_old.balanceOf(spender);
        expect(old_balance_spender).to.eq(0n);
        // ensure new[owner] = 1 & new[spender] = 0
        const new_balance_owner = await moe_new.balanceOf(owner);
        expect(new_balance_owner).to.eq(UNIT);
        const new_balance_spender = await moe_new.balanceOf(spender);
        expect(new_balance_spender).to.eq(0n);
      }
    });
    it("should *but* migrate old[0] = 0 balance", async function () {
      const tx = await moe_new.migrate(1n, [0, 0]);
      expect(tx).to.be.an("object");
      const new_migrated = await moe_new.migrated();
      expect(new_migrated).to.eq(0n);
    });
    it("should *not* migrate old[0] (insufficient allowance)", async function () {
      const tx = await moe_old.fake(addresses[0], 1n);
      expect(tx).to.be.an("object");
      expect(await moe_old.balanceOf(addresses[0])).to.eq(3n);
      const new_migrate = await moe_new.migrate(1n, [0, 0]).catch((ex) => {
        const m = ex.message.match(/insufficient allowance/);
        if (m === null) console.debug(ex);
        expect(m).to.not.eq(null);
      });
      expect(new_migrate).to.eq(undefined);
      const new_migrated = await moe_new.migrated();
      expect(new_migrated).to.eq(0n);
    });
    it("should *but* migrate old[0] = 2 balance", async function () {
      const tx = await moe_old.fake(addresses[0], 1n);
      expect(tx).to.be.an("object");
      expect(await moe_old.balanceOf(addresses[0])).to.eq(3n);
      // increase allowance for spender (i.e. XPowerNew)
      const [owner, spender] = [addresses[0], moe_new.target];
      const old_increase = await moe_old.increaseAllowance(spender, 5n);
      expect(old_increase).to.be.an("object");
      const old_allowance = await moe_old.allowance(owner, spender);
      expect(old_allowance).to.eq(5n);
      const new_allowance = await moe_new.allowance(owner, spender);
      expect(new_allowance).to.eq(0n);
      // migrate amount from old[owner] to new[owner]
      const new_migrate = await moe_new.migrate(2n, [0, 0]);
      expect(new_migrate).to.be.an("object");
      // ensure migrated amount = 2
      const new_migrated = await moe_new.migrated();
      expect(new_migrated).to.eq(UNIT * 2n);
    });
    it("should migrate old[2]", async function () {
      const minter = accounts[2];
      expect(minter.address).to.match(/^0x/);
      const tx = await moe_old.connect(minter).fake(minter.address, 1n);
      expect(tx).to.be.an("object");
      expect(await moe_old.balanceOf(minter.address)).to.eq(1n);
      // increase allowance for spender (i.e. XPowerNew)
      const [owner, spender] = [minter.address, moe_new.target];
      const old_increase = await moe_old
        .connect(minter)
        .increaseAllowance(spender, 1n);
      expect(old_increase).to.be.an("object");
      const old_allowance = await moe_old.allowance(owner, spender);
      expect(old_allowance).to.eq(1n);
      const new_allowance = await moe_new.allowance(owner, spender);
      expect(new_allowance).to.eq(0n);
      // migrate amount from old[owner] to new[owner]
      const new_migrate = await moe_new.connect(minter).migrate(1n, [0, 0]);
      expect(new_migrate).to.be.an("object");
      // ensure migrated amount = 1
      const new_migrated = await moe_new.migrated();
      expect(new_migrated).to.eq(UNIT);
      // ensure old[owner] = 0 & old[spender] = 0
      const old_balance_owner = await moe_old.balanceOf(owner);
      expect(old_balance_owner).to.eq(0n);
      const old_balance_spender = await moe_old.balanceOf(spender);
      expect(old_balance_spender).to.eq(0n);
      // ensure new[owner] = 1 & new[spender] = 0
      const new_balance_owner = await moe_new.balanceOf(owner);
      expect(new_balance_owner).to.eq(UNIT);
      const new_balance_spender = await moe_new.balanceOf(spender);
      expect(new_balance_spender).to.eq(0n);
    });
    it("should *not* migrate old[2] (migration sealed)", async function () {
      const minter = accounts[2];
      expect(minter.address).to.match(/^0x/);
      const tx = await moe_old.connect(minter).fake(minter.address, 1n);
      expect(tx).to.be.an("object");
      expect(await moe_old.balanceOf(minter.address)).to.eq(1n);
      // deploy xpower_new contract (w/o transferring ownership):
      moe_new = await MoeNew.deploy([moe_old.target], DEADLINE_NEW);
      expect(moe_new.target).to.match(/^0x[0-9a-f]/i);
      // increase allowance for spender (i.e. XPowerNew)
      const [owner, spender] = [minter.address, moe_new.target];
      const old_increase = await moe_old
        .connect(minter)
        .increaseAllowance(spender, 1n);
      expect(old_increase).to.be.an("object");
      const old_allowance = await moe_old.allowance(owner, spender);
      expect(old_allowance).to.eq(1n);
      const new_allowance = await moe_new.allowance(owner, spender);
      expect(new_allowance).to.eq(0n);
      // grant seal role to default account (i.e. deployer)
      await moe_new.grantRole(moe_new.MOE_SEAL_ROLE(), addresses[0]);
      // seal migrate option
      expect(await moe_new.seals()).to.deep.eq([false]);
      await moe_new.seal(0);
      expect(await moe_new.seals()).to.deep.eq([true]);
      await moe_new.sealAll();
      expect(await moe_new.seals()).to.deep.eq([true]);
      // migrate amount from old[owner] to new[owner]
      const new_migrate = await moe_new
        .connect(minter)
        .migrate(1n, [0, 0])
        .catch((ex) => {
          const m = ex.message.match(/migration sealed/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        });
      expect(new_migrate).to.eq(undefined);
      // ensure migrated amount = 0
      const new_migrated = await moe_new.migrated();
      expect(new_migrated).to.eq(0n);
    });
    it("should *not* seal new (missing role)", async function () {
      const minter = accounts[2];
      expect(minter.address).to.match(/^0x/);
      // deploy xpower_new contract (w/o transferring ownership):
      moe_new = await MoeNew.deploy([moe_old.target], DEADLINE_NEW);
      expect(moe_new.target).to.match(/^0x[0-9a-f]/i);
      // grant seal role to default account (but *not* minter)
      await moe_new.grantRole(moe_new.MOE_SEAL_ROLE(), addresses[0]);
      // try to seal migrate option
      try {
        const new_seal = await moe_new.connect(minter).seal(0);
        expect(new_seal).to.be.an(undefined);
      } catch (ex) {
        const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
        if (m === null) console.debug(ex);
        expect(m).to.not.eq(null);
      }
    });
    it("should *not* migrate old[2] (deadline passed)", async function () {
      const minter = accounts[2];
      expect(minter.address).to.match(/^0x/);
      const tx = await moe_old.connect(minter).fake(minter.address, 3n);
      expect(tx).to.be.an("object");
      expect(await moe_old.balanceOf(minter.address)).to.eq(3n);
      expect(await moe_old.balanceOf(addresses[0])).to.eq(6n);
      // increase allowance for spender (i.e. XPowerNew)
      const [owner, spender] = [minter.address, moe_new.target];
      const old_increase = await moe_old
        .connect(minter)
        .increaseAllowance(spender, 3n);
      expect(old_increase).to.be.an("object");
      const old_allowance = await moe_old.allowance(owner, spender);
      expect(old_allowance).to.eq(3n);
      const new_allowance = await moe_new.allowance(owner, spender);
      expect(new_allowance).to.eq(0n);
      // forward time by one week (1st increase)
      await network.provider.send("evm_increaseTime", [DEADLINE_NEW / 3]);
      // migrate amount from old[owner] to new[owner]
      const new_migrate_1 = await moe_new.connect(minter).migrate(1n, [0, 0]);
      expect(new_migrate_1).to.be.an("object");
      const new_migrated_1 = await moe_new.migrated();
      expect(new_migrated_1).to.eq(UNIT);
      // forward time by one more week (2nd increase)
      await network.provider.send("evm_increaseTime", [DEADLINE_NEW / 3]);
      // migrate amount from old[owner] to new[owner]
      const new_migrate_2 = await moe_new.connect(minter).migrate(1n, [0, 0]);
      expect(new_migrate_2).to.be.an("object");
      const new_migrated_2 = await moe_new.migrated();
      expect(new_migrated_2).to.eq(2n * UNIT);
      // forward time by one more week (3rd increase)
      await network.provider.send("evm_increaseTime", [DEADLINE_NEW / 3]);
      // migrate amount from old[owner] to new[owner]
      const new_migrate_3 = await moe_new
        .connect(minter)
        .migrate(1n, [0, 0])
        .catch((ex) => {
          const m = ex.message.match(/deadline passed/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        });
      expect(new_migrate_3).to.eq(undefined);
      // ensure migrated amount = 2 (and not 3)
      const new_migrated_3 = await moe_new.migrated();
      expect(new_migrated_3).to.eq(2n * UNIT);
      // ensure old[owner] = 1 & old[spender] = 0
      const old_balance_owner = await moe_old.balanceOf(owner);
      expect(old_balance_owner).to.eq(1n);
      const old_balance_spender = await moe_old.balanceOf(spender);
      expect(old_balance_spender).to.eq(0n);
      // ensure new[owner] = 2 & new[spender] = 0
      const new_balance_owner = await moe_new.balanceOf(owner);
      expect(new_balance_owner).to.eq(2n * UNIT);
      const new_balance_spender = await moe_new.balanceOf(spender);
      expect(new_balance_spender).to.eq(0n);
    });
  });
});
