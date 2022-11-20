/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let A0, A1; // addresses[0,1]
let APowerOld, APowerNew; // contracts
let XPowerOld, XPowerNew; // contracts
let apower_old, apower_new; // instances
let xpower_old, xpower_new; // instances
let Nft, NftStaked, NftTreasury; // contracts
let nft, nft_staked, nft_treasury; // instances
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
    APowerOld = await ethers.getContractFactory("APowerOdinOldTest");
    APowerNew = await ethers.getContractFactory("APowerOdinTest");
    XPowerOld = await ethers.getContractFactory("XPowerOdinOldTest");
    XPowerNew = await ethers.getContractFactory("XPowerOdinTest");
  });
  beforeEach(async function () {
    Nft = await ethers.getContractFactory("XPowerOdinNft");
    expect(Nft).to.exist;
    NftStaked = await ethers.getContractFactory("XPowerOdinNftStaked");
    expect(NftStaked).to.exist;
    NftTreasury = await ethers.getContractFactory("NftTreasury");
    expect(NftTreasury).to.exist;
    MoeTreasury = await ethers.getContractFactory("MoeTreasury");
    expect(MoeTreasury).to.exist;
  });
  beforeEach(async function () {
    // deploy old apower contract:
    xpower_old = await XPowerOld.deploy([], DEADLINE);
    expect(xpower_old).to.exist;
    await xpower_old.deployed();
    await xpower_old.init();
    // deploy new apower contract:
    xpower_new = await XPowerNew.deploy([xpower_old.address], DEADLINE);
    expect(xpower_new).to.exist;
    await xpower_new.deployed();
    await xpower_new.init();
  });
  beforeEach(async function () {
    const decimals = await xpower_old.decimals();
    expect(decimals).to.eq(0);
    UNUM_OLD = 10n ** BigInt(decimals);
    expect(UNUM_OLD >= 1n).to.be.true;
    DECI_OLD = 10n * UNUM_OLD;
  });
  beforeEach(async function () {
    const decimals = await xpower_new.decimals();
    expect(decimals).to.greaterThan(0);
    UNUM_NEW = 10n ** BigInt(decimals);
    expect(UNUM_NEW >= 1n).to.be.true;
    DECI_NEW = 10n * UNUM_NEW;
  });
  beforeEach(async function () {
    // deploy old apower contract:
    apower_old = await APowerOld.deploy(xpower_old.address, [], DEADLINE);
    expect(apower_old).to.exist;
    await apower_old.deployed();
    // deploy new apower contract:
    apower_new = await APowerNew.deploy(
      xpower_new.address,
      [apower_old.address],
      DEADLINE
    );
    expect(apower_new).to.exist;
    await apower_new.deployed();
  });
  beforeEach(async function () {
    table = await new HashTable(xpower_old, A0).init({
      length: 2n,
      min_level: 3,
      max_level: 3,
      use_cache: true,
    });
  });
  beforeEach(async function () {
    nft = await Nft.deploy(NFT_ODIN_URL, xpower_old.address, [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
  });
  beforeEach(async function () {
    nft_staked = await NftStaked.deploy(NFT_ODIN_URL, [], DEADLINE);
    expect(nft_staked).to.exist;
    await nft_staked.deployed();
  });
  beforeEach(async function () {
    nft_treasury = await NftTreasury.deploy(nft.address, nft_staked.address);
    expect(nft_treasury).to.exist;
    await nft_treasury.deployed();
  });
  beforeEach(async function () {
    moe_treasury = await MoeTreasury.deploy(
      apower_old.address,
      xpower_old.address,
      nft_staked.address
    );
    expect(moe_treasury).to.exist;
    await moe_treasury.deployed();
    mt = moe_treasury;
  });
  beforeEach(async function () {
    await apower_old.transferOwnership(moe_treasury.address);
    expect(await apower_old.owner()).to.eq(moe_treasury.address);
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
    const old_supply = await xpower_old.totalSupply();
    expect(old_supply).to.be.gt(0);
    const new_supply = await xpower_new.totalSupply();
    expect(new_supply).to.be.eq(0);
  });
  beforeEach(async function () {
    await increaseAllowanceBy(1000n * UNUM_OLD, nft.address);
  });
  beforeEach(async function () {
    await xpower_old.transfer(moe_treasury.address, 110n * UNUM_OLD);
  });
  beforeEach(async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
    expect(await mt.claimFor(account, nft_id)).to.be.an("object");
    expect(await mt.rewardOf(account, nft_id)).to.eq(DECI_OLD);
    expect(await mt.totalRewardOf(nft_id)).to.eq(DECI_OLD);
    expect(await mt.claimedFor(account, nft_id)).to.eq(DECI_OLD);
    expect(await mt.totalClaimedFor(nft_id)).to.eq(DECI_OLD);
    expect(await mt.claimableFor(account, nft_id)).to.eq(0);
    expect(await mt.totalClaimableFor(nft_id)).to.eq(0);
    expect(await mt.balance()).to.eq(100n * UNUM_OLD);
  });
  beforeEach(async function () {
    const old_supply = await apower_old.totalSupply();
    expect(old_supply).to.be.gt(0);
    const new_supply = await apower_new.totalSupply();
    expect(new_supply).to.be.eq(0);
  });
  describe("indexOf", async function () {
    it("should return index=0", async function () {
      const index = await apower_new.indexOf(apower_old.address);
      expect(index).to.eq(0);
    });
  });
  it("should *not* migrate old => new (insufficient allowance)", async function () {
    const tx = await apower_new.migrate(DECI_OLD, [0, 0]).catch((ex) => {
      const m = ex.message.match(/insufficient allowance/);
      if (m === null) console.debug(ex);
      expect(m).to.be.not.null;
    });
    expect(tx).to.eq(undefined);
    const new_migrated = await apower_new.migrated();
    expect(new_migrated).to.eq(0);
  });
  it("should *not* migrate old => new (burn amount exceeds balance)", async function () {
    await apower_old.increaseAllowance(apower_new.address, 51n * UNUM_OLD);
    const tx = await apower_new.migrate(51n * UNUM_OLD, [0, 0]).catch((ex) => {
      const m = ex.message.match(/burn amount exceeds balance/);
      if (m === null) console.debug(ex);
      expect(m).to.be.not.null;
    });
    expect(tx).to.eq(undefined);
    const new_migrated = await apower_new.migrated();
    expect(new_migrated).to.eq(0);
  });
  it("should migrate old => new", async function () {
    await xpower_old.increaseAllowance(xpower_new.address, DECI_OLD);
    await xpower_new.increaseAllowance(apower_new.address, DECI_NEW);
    await apower_old.increaseAllowance(apower_new.address, DECI_OLD);
    expect(await apower_old.balanceOf(A0)).to.eq(DECI_OLD);
    expect(await apower_new.balanceOf(A0)).to.eq(0);
    await apower_new.migrate(DECI_OLD, [0, 0]);
    expect(await apower_old.balanceOf(A0)).to.eq(0);
    expect(await apower_new.balanceOf(A0)).to.eq(DECI_NEW);
  });
  it("should *not* migrate old => new (migration sealed)", async function () {
    await apower_new.grantRole(apower_new.SOV_SEAL_ROLE(), A0);
    expect(await apower_new.sealedAll()).to.deep.eq([false]);
    await apower_new.seal(0);
    expect(await apower_new.sealedAll()).to.deep.eq([true]);
    await apower_old.increaseAllowance(apower_new.address, DECI_OLD);
    const tx = await apower_new.migrate(DECI_OLD, [0, 0]).catch((ex) => {
      const m = ex.message.match(/migration sealed/);
      if (m === null) console.debug(ex);
      expect(m).to.be.not.null;
    });
    expect(tx).to.eq(undefined);
    const new_migrated = await apower_new.migrated();
    expect(new_migrated).to.eq(0);
  });
  it("should *not* seal new (account is missing role)", async function () {
    const tx = await apower_new.seal(0).catch((ex) => {
      const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
      if (m === null) console.debug(ex);
      expect(m).to.be.not.null;
    });
    expect(tx).to.eq(undefined);
    const new_migrated = await apower_new.migrated();
    expect(new_migrated).to.eq(0);
  });
  it("should *not* migrate old => new (deadline passed)", async function () {
    await network.provider.send("evm_increaseTime", [126_230_400]);
    await apower_old.increaseAllowance(apower_new.address, DECI_OLD);
    const tx = await apower_new.migrate(DECI_OLD, [0, 0]).catch((ex) => {
      const m = ex.message.match(/deadline passed/);
      if (m === null) console.debug(ex);
      expect(m).to.be.not.null;
    });
    expect(tx).to.eq(undefined);
    const new_migrated = await apower_new.migrated();
    expect(new_migrated).to.eq(0);
  });
});
async function mintToken(amount) {
  const [nonce, block_hash] = table.nextNonce({ amount });
  expect(nonce).to.gte(0);
  const tx_cache = await xpower_old.cache(block_hash);
  expect(tx_cache).to.be.an("object");
  const tx_mint = await xpower_old.mint(A0, block_hash, nonce);
  expect(tx_mint).to.be.an("object");
  const balance_0 = await xpower_old.balanceOf(A0);
  expect(balance_0).to.be.gte(amount);
  const balance_1 = await xpower_old.balanceOf(A1);
  expect(balance_1).to.eq(0);
}
async function increaseAllowanceBy(amount, spender) {
  const tx_increase = await xpower_old.increaseAllowance(spender, amount);
  expect(tx_increase).to.be.an("object");
  const allowance = await xpower_old.allowance(A0, spender);
  expect(allowance).to.gte(amount);
}
async function mintNft(level, amount) {
  const nft_id = await nft.idBy(await nft.year(), level);
  expect(nft_id.gt(0)).to.eq(true);
  const tx_mint = await nft.mint(A0, level, amount);
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
  const tx_transfer = await nft_staked.transferOwnership(address);
  expect(tx_transfer).to.be.an("object");
  const nft_balance_old = await nft.balanceOf(account, nft_id);
  expect(nft_balance_old).to.gte(amount);
  const tx_stake = await nft_treasury.stake(account, nft_id, amount);
  expect(tx_stake).to.be.an("object");
  const nft_staked_balance = await nft_staked.balanceOf(account, nft_id);
  expect(nft_staked_balance).to.be.gte(amount);
  const nft_treasury_balance = await nft.balanceOf(address, nft_id);
  expect(nft_treasury_balance).to.be.gte(amount);
  const nft_balance = await nft.balanceOf(account, nft_id);
  expect(nft_balance).to.eq(nft_balance_old.sub(amount));
  return [account, nft_id];
}
