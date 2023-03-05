/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let A0, A1; // addresses[0,1]
let AThorOld, AThorNew; // contracts
let XThorOld, XThorNew; // contracts
let ALokiOld, ALokiNew; // contracts
let XLokiOld, XLokiNew; // contracts
let AOdinOld, AOdinNew; // contracts
let XOdinOld, XOdinNew; // contracts
let athor_old, athor_new; // instances
let xthor_old, xthor_new; // instances
let aloki_old, aloki_new; // instances
let xloki_old, xloki_new; // instances
let aodin_old, aodin_new; // instances
let xodin_old, xodin_new; // instances
let Nft, Ppt, NftTreasury; // contracts
let nft, ppt, nft_treasury; // instances
let MoeTreasury; // contracts
let moe_treasury, mt; // instances
let UNUM_OLD, UNUM_NEW; // decimals
let DECI_OLD, DECI_NEW; // 10 units

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const NFT_ODIN_URL = "https://xpowermine.com/nfts/odin/{id}.json";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years
const DAYS = 86_400; // [seconds]

describe("APower Migration", async function () {
  beforeEach(async function () {
    await network.provider.send("hardhat_reset");
  });
  beforeEach(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
    addresses = accounts.map((acc) => acc.address);
    expect(addresses.length).to.be.greaterThan(1);
    [A0, A1] = addresses;
  });
  beforeEach(async function () {
    AThorOld = await ethers.getContractFactory("APowerThorOldTest");
    AThorNew = await ethers.getContractFactory("APowerThorTest");
    XThorOld = await ethers.getContractFactory("XPowerThorOldTest");
    XThorNew = await ethers.getContractFactory("XPowerThorTest");
    ALokiOld = await ethers.getContractFactory("APowerLokiOldTest");
    ALokiNew = await ethers.getContractFactory("APowerLokiTest");
    XLokiOld = await ethers.getContractFactory("XPowerLokiOldTest");
    XLokiNew = await ethers.getContractFactory("XPowerLokiTest");
    AOdinOld = await ethers.getContractFactory("APowerOdinOldTest");
    AOdinNew = await ethers.getContractFactory("APowerOdinTest");
    XOdinOld = await ethers.getContractFactory("XPowerOdinOldTest");
    XOdinNew = await ethers.getContractFactory("XPowerOdinTest");
  });
  beforeEach(async function () {
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.exist;
    Ppt = await ethers.getContractFactory("XPowerPpt");
    expect(Ppt).to.exist;
    NftTreasury = await ethers.getContractFactory("NftTreasury");
    expect(NftTreasury).to.exist;
    MoeTreasury = await ethers.getContractFactory("MoeTreasury");
    expect(MoeTreasury).to.exist;
  });
  beforeEach(async function () {
    // deploy old apower contract:
    xthor_old = await XThorOld.deploy([], DEADLINE);
    expect(xthor_old).to.exist;
    await xthor_old.deployed();
    await xthor_old.init();
    xloki_old = await XLokiOld.deploy([], DEADLINE);
    expect(xloki_old).to.exist;
    await xloki_old.deployed();
    await xloki_old.init();
    xodin_old = await XOdinOld.deploy([], DEADLINE);
    expect(xodin_old).to.exist;
    await xodin_old.deployed();
    await xodin_old.init();
    // deploy new apower contract:
    xthor_new = await XThorNew.deploy([xthor_old.address], DEADLINE);
    expect(xthor_new).to.exist;
    await xthor_new.deployed();
    await xthor_new.init();
    xloki_new = await XLokiNew.deploy([xloki_old.address], DEADLINE);
    expect(xloki_new).to.exist;
    await xloki_new.deployed();
    await xloki_new.init();
    xodin_new = await XOdinNew.deploy([xodin_old.address], DEADLINE);
    expect(xodin_new).to.exist;
    await xodin_new.deployed();
    await xodin_new.init();
  });
  beforeEach(async function () {
    const decimals = await xodin_old.decimals();
    expect(decimals).to.eq(0);
    UNUM_OLD = 10n ** BigInt(decimals);
    expect(UNUM_OLD >= 1n).to.be.true;
    DECI_OLD = 10n * UNUM_OLD;
  });
  beforeEach(async function () {
    const decimals = await xodin_new.decimals();
    expect(decimals).to.greaterThan(0);
    UNUM_NEW = 10n ** BigInt(decimals);
    expect(UNUM_NEW >= 1n).to.be.true;
    DECI_NEW = 10n * UNUM_NEW;
  });
  beforeEach(async function () {
    // deploy old apower contracts:
    athor_old = await AThorOld.deploy(xthor_old.address, [], DEADLINE);
    expect(athor_old).to.exist;
    await athor_old.deployed();
    aloki_old = await ALokiOld.deploy(xloki_old.address, [], DEADLINE);
    expect(aloki_old).to.exist;
    await aloki_old.deployed();
    aodin_old = await AOdinOld.deploy(xodin_old.address, [], DEADLINE);
    expect(aodin_old).to.exist;
    await aodin_old.deployed();
    // deploy new apower contracts:
    athor_new = await AThorNew.deploy(
      xthor_new.address,
      [athor_old.address],
      DEADLINE
    );
    expect(athor_new).to.exist;
    await athor_new.deployed();
    aloki_new = await ALokiNew.deploy(
      xloki_new.address,
      [aloki_old.address],
      DEADLINE
    );
    expect(aloki_new).to.exist;
    await aloki_new.deployed();
    aodin_new = await AOdinNew.deploy(
      xodin_new.address,
      [aodin_old.address],
      DEADLINE
    );
    expect(aodin_new).to.exist;
    await aodin_new.deployed();
  });
  beforeEach(async function () {
    table = await new HashTable(xodin_old, A0).init({
      length: 2n,
      min_level: 3,
      max_level: 3,
      use_cache: true,
    });
  });
  beforeEach(async function () {
    nft = await Nft.deploy(NFT_ODIN_URL, [xodin_old.address], [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
  });
  beforeEach(async function () {
    ppt = await Ppt.deploy(NFT_ODIN_URL, [], DEADLINE);
    expect(ppt).to.exist;
    await ppt.deployed();
  });
  beforeEach(async function () {
    nft_treasury = await NftTreasury.deploy(nft.address, ppt.address);
    expect(nft_treasury).to.exist;
    await nft_treasury.deployed();
  });
  beforeEach(async function () {
    moe_treasury = await MoeTreasury.deploy(
      [xthor_old.address, xloki_old.address, xodin_old.address],
      [athor_old.address, aloki_old.address, aodin_old.address],
      ppt.address
    );
    expect(moe_treasury).to.exist;
    await moe_treasury.deployed();
    mt = moe_treasury;
  });
  beforeEach(async function () {
    await athor_old.transferOwnership(moe_treasury.address);
    expect(await athor_old.owner()).to.eq(moe_treasury.address);
    await aloki_old.transferOwnership(moe_treasury.address);
    expect(await aloki_old.owner()).to.eq(moe_treasury.address);
    await aodin_old.transferOwnership(moe_treasury.address);
    expect(await aodin_old.owner()).to.eq(moe_treasury.address);
  });
  beforeEach(async function () {
    while (true)
      try {
        await mintToken(4095);
      } catch (ex) {
        break;
      }
    table.reset();
  });
  beforeEach(async function () {
    const old_supply = await xodin_old.totalSupply();
    expect(old_supply).to.be.gt(0);
    const new_supply = await xodin_new.totalSupply();
    expect(new_supply).to.be.eq(0);
  });
  beforeEach(async function () {
    await increaseAllowanceBy(1000n * UNUM_OLD, nft.address);
  });
  beforeEach(async function () {
    await xodin_old.transfer(moe_treasury.address, 110n * UNUM_OLD);
  });
  beforeEach(async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
    expect(await mt.claimFor(account, nft_id)).to.be.an("object");
    expect(await mt.rewardOf(account, nft_id)).to.eq(DECI_OLD);
    expect(await mt.claimedFor(account, nft_id)).to.eq(DECI_OLD);
    expect(await mt.claimableFor(account, nft_id)).to.eq(0);
    expect(await mt.moeBalanceOf(2)).to.eq(100n * UNUM_OLD);
  });
  beforeEach(async function () {
    const old_supply = await aodin_old.totalSupply();
    expect(old_supply).to.be.gt(0);
    const new_supply = await aodin_new.totalSupply();
    expect(new_supply).to.be.eq(0);
  });
  describe("oldIndexOf", async function () {
    it("should return index=0", async function () {
      const index = await aodin_new.oldIndexOf(aodin_old.address);
      expect(index).to.eq(0);
    });
  });
  it("should *not* migrate old => new (insufficient allowance)", async function () {
    const tx = await aodin_new.migrate(DECI_OLD, [0, 0]).catch((ex) => {
      const m = ex.message.match(/insufficient allowance/);
      if (m === null) console.debug(ex);
      expect(m).to.be.not.null;
    });
    expect(tx).to.eq(undefined);
    const new_migrated = await aodin_new.migrated();
    expect(new_migrated).to.eq(0);
  });
  it("should *not* migrate old => new (burn amount exceeds balance)", async function () {
    await aodin_old.increaseAllowance(aodin_new.address, 51n * UNUM_OLD);
    const tx = await aodin_new.migrate(51n * UNUM_OLD, [0, 0]).catch((ex) => {
      const m = ex.message.match(/burn amount exceeds balance/);
      if (m === null) console.debug(ex);
      expect(m).to.be.not.null;
    });
    expect(tx).to.eq(undefined);
    const new_migrated = await aodin_new.migrated();
    expect(new_migrated).to.eq(0);
  });
  it("should migrate old => new", async function () {
    await xodin_old.increaseAllowance(xodin_new.address, DECI_OLD);
    await xodin_new.increaseAllowance(aodin_new.address, DECI_NEW);
    await aodin_old.increaseAllowance(aodin_new.address, DECI_OLD);
    expect(await aodin_old.balanceOf(A0)).to.eq(DECI_OLD);
    expect(await aodin_new.balanceOf(A0)).to.eq(0);
    await aodin_new.migrate(DECI_OLD, [0, 0]);
    expect(await aodin_old.balanceOf(A0)).to.eq(0);
    expect(await aodin_new.balanceOf(A0)).to.eq(DECI_NEW);
  });
  it("should *not* migrate old => new (migration sealed)", async function () {
    await aodin_new.grantRole(aodin_new.SOV_SEAL_ROLE(), A0);
    expect(await aodin_new.seals()).to.deep.eq([false]);
    await aodin_new.seal(0);
    expect(await aodin_new.seals()).to.deep.eq([true]);
    await aodin_new.sealAll();
    expect(await aodin_new.seals()).to.deep.eq([true]);
    await aodin_old.increaseAllowance(aodin_new.address, DECI_OLD);
    const tx = await aodin_new.migrate(DECI_OLD, [0, 0]).catch((ex) => {
      const m = ex.message.match(/migration sealed/);
      if (m === null) console.debug(ex);
      expect(m).to.be.not.null;
    });
    expect(tx).to.eq(undefined);
    const new_migrated = await aodin_new.migrated();
    expect(new_migrated).to.eq(0);
  });
  it("should *not* seal new (missing role)", async function () {
    const tx = await aodin_new.seal(0).catch((ex) => {
      const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
      if (m === null) console.debug(ex);
      expect(m).to.be.not.null;
    });
    expect(tx).to.eq(undefined);
    const new_migrated = await aodin_new.migrated();
    expect(new_migrated).to.eq(0);
  });
  it("should *not* migrate old => new (deadline passed)", async function () {
    await network.provider.send("evm_increaseTime", [126_230_400]);
    await aodin_old.increaseAllowance(aodin_new.address, DECI_OLD);
    const tx = await aodin_new.migrate(DECI_OLD, [0, 0]).catch((ex) => {
      const m = ex.message.match(/deadline passed/);
      if (m === null) console.debug(ex);
      expect(m).to.be.not.null;
    });
    expect(tx).to.eq(undefined);
    const new_migrated = await aodin_new.migrated();
    expect(new_migrated).to.eq(0);
  });
});
async function mintToken(amount) {
  const [nonce, block_hash] = table.nextNonce({ amount });
  expect(nonce).to.gte(0);
  const tx_cache = await xodin_old.cache(block_hash);
  expect(tx_cache).to.be.an("object");
  const tx_mint = await xodin_old.mint(A0, block_hash, nonce);
  expect(tx_mint).to.be.an("object");
  const balance_0 = await xodin_old.balanceOf(A0);
  expect(balance_0).to.be.gte(amount);
  const balance_1 = await xodin_old.balanceOf(A1);
  expect(balance_1).to.eq(0);
}
async function increaseAllowanceBy(amount, spender) {
  const tx_increase = await xodin_old.increaseAllowance(spender, amount);
  expect(tx_increase).to.be.an("object");
  const allowance = await xodin_old.allowance(A0, spender);
  expect(allowance).to.gte(amount);
}
async function mintNft(level, amount) {
  const moe_prefix = await xodin_old.prefix();
  const nft_id = await nft.idBy(await nft.year(), level, moe_prefix);
  expect(nft_id.gt(0)).to.eq(true);
  const moe_index = await nft.moeIndexOf(xodin_old.address);
  const tx_mint = await nft.mint(A0, level, amount, moe_index);
  expect(tx_mint).to.be.an("object");
  const nft_balance = await nft.balanceOf(A0, nft_id);
  expect(nft_balance).to.eq(amount);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply).to.eq(amount);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(nft_balance.gt(0));
  return nft_id;
}
async function stakeNft(nft_id, amount) {
  const [account, address] = [A0, nft_treasury.address];
  const tx_approval = await await nft.setApprovalForAll(address, true);
  expect(tx_approval).to.be.an("object");
  const tx_transfer = await ppt.transferOwnership(address);
  expect(tx_transfer).to.be.an("object");
  const nft_balance_old = await nft.balanceOf(account, nft_id);
  expect(nft_balance_old).to.gte(amount);
  const tx_stake = await nft_treasury.stake(account, nft_id, amount);
  expect(tx_stake).to.be.an("object");
  const nft_staked_balance = await ppt.balanceOf(account, nft_id);
  expect(nft_staked_balance).to.be.gte(amount);
  const nft_treasury_balance = await nft.balanceOf(address, nft_id);
  expect(nft_treasury_balance).to.be.gte(amount);
  const nft_balance = await nft.balanceOf(account, nft_id);
  expect(nft_balance).to.eq(nft_balance_old.sub(amount));
  return [account, nft_id];
}
