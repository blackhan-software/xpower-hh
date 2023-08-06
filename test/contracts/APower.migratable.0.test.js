/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let A0, A1; // addresses[0,1]
let MoeOld, MoeNew; // contracts
let SovOld, SovNew; // contracts
let moe_old, moe_new; // instances
let sov_old, sov_new; // instances
let UNIT_OLD, UNIT_NEW; // decimals
let DECI_OLD, DECI_NEW; // 10 units

let Mty, Nft, Ppt, Nty; // contracts
let mty, nft, ppt, nty; // instances

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
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
    SovOld = await ethers.getContractFactory("APowerOldTest");
    SovNew = await ethers.getContractFactory("APowerTest");
    MoeOld = await ethers.getContractFactory("XPowerOldTest");
    MoeNew = await ethers.getContractFactory("XPowerTest");
  });
  beforeEach(async function () {
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.exist;
    Ppt = await ethers.getContractFactory("XPowerPpt");
    expect(Ppt).to.exist;
    Mty = await ethers.getContractFactory("MoeTreasury");
    expect(Mty).to.exist;
    Nty = await ethers.getContractFactory("NftTreasury");
    expect(Nty).to.exist;
  });
  beforeEach(async function () {
    // deploy old apower contract:
    moe_old = await MoeOld.deploy([], DEADLINE);
    expect(moe_old).to.exist;
    await moe_old.deployed();
    await moe_old.init();
    // deploy new apower contract:
    moe_new = await MoeNew.deploy([moe_old.address], DEADLINE);
    expect(moe_new).to.exist;
    await moe_new.deployed();
    await moe_new.init();
  });
  beforeEach(async function () {
    const decimals = await moe_old.decimals();
    expect(decimals).to.eq(0);
    UNIT_OLD = 10n ** BigInt(decimals);
    expect(UNIT_OLD >= 1n).to.be.true;
    DECI_OLD = 10n * UNIT_OLD;
  });
  beforeEach(async function () {
    const decimals = await moe_new.decimals();
    expect(decimals).to.eq(18);
    UNIT_NEW = 10n ** BigInt(decimals);
    expect(UNIT_NEW >= 1n).to.be.true;
    DECI_NEW = 10n * UNIT_NEW;
  });
  beforeEach(async function () {
    // deploy old apower contracts:
    sov_old = await SovOld.deploy(moe_old.address, [], DEADLINE);
    expect(sov_old).to.exist;
    await sov_old.deployed();
    // deploy new apower contracts:
    sov_new = await SovNew.deploy(moe_new.address, [sov_old.address], DEADLINE);
    expect(sov_new).to.exist;
    await sov_new.deployed();
  });
  beforeEach(async function () {
    nft = await Nft.deploy(moe_old.address, NFT_XPOW_URL, [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
    ppt = await Ppt.deploy(NFT_XPOW_URL, [], DEADLINE);
    expect(ppt).to.exist;
    await ppt.deployed();
  });
  beforeEach(async function () {
    mty = await Mty.deploy(moe_old.address, sov_old.address, ppt.address);
    expect(mty).to.exist;
    await mty.deployed();
    nty = await Nty.deploy(nft.address, ppt.address, mty.address);
    expect(nty).to.exist;
    await nty.deployed();
  });
  beforeEach(async function () {
    await sov_old.transferOwnership(mty.address);
    expect(await sov_old.owner()).to.eq(mty.address);
  });
  beforeEach(async function () {
    await mintToken(1110n * UNIT_OLD);
  });
  beforeEach(async function () {
    const old_supply = await moe_old.totalSupply();
    expect(old_supply).to.be.gt(0);
    const new_supply = await moe_new.totalSupply();
    expect(new_supply).to.be.eq(0);
  });
  beforeEach(async function () {
    await increaseAllowanceBy(1000n * UNIT_OLD, nft.address);
  });
  beforeEach(async function () {
    await moe_old.transfer(mty.address, 110n * UNIT_OLD);
  });
  beforeEach(async function () {
    const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
    // wait for +12 months: 1st year
    await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
    expect(await mty.claim(account, nft_id)).to.be.an("object");
    expect(await mty.rewardOf(account, nft_id)).to.eq(DECI_OLD);
    expect(await mty.claimed(account, nft_id)).to.eq(DECI_OLD);
    expect(await mty.claimable(account, nft_id)).to.eq(0);
    expect(await moe_old.balanceOf(mty.address)).to.eq(100n * UNIT_OLD);
  });
  beforeEach(async function () {
    const old_supply = await sov_old.totalSupply();
    expect(old_supply).to.be.gt(0);
    const new_supply = await sov_new.totalSupply();
    expect(new_supply).to.be.eq(0);
  });
  it("should *not* migrate old (insufficient allowance)", async function () {
    const tx = await sov_new.migrate(DECI_OLD, [0, 0]).catch((ex) => {
      const m = ex.message.match(/insufficient allowance/);
      if (m === null) console.debug(ex);
      expect(m).to.be.not.null;
    });
    expect(tx).to.eq(undefined);
    const new_migrated = await sov_new.migrated();
    expect(new_migrated).to.eq(0);
  });
  it("should *not* migrate old (burn amount exceeds balance)", async function () {
    await sov_old.increaseAllowance(sov_new.address, 51n * UNIT_OLD);
    const tx = await sov_new.migrate(51n * UNIT_OLD, [0, 0]).catch((ex) => {
      const m = ex.message.match(/burn amount exceeds balance/);
      if (m === null) console.debug(ex);
      expect(m).to.be.not.null;
    });
    expect(tx).to.eq(undefined);
    const new_migrated = await sov_new.migrated();
    expect(new_migrated).to.eq(0);
  });
  it("should migrate old", async function () {
    await moe_old.increaseAllowance(moe_new.address, DECI_OLD);
    await moe_new.increaseAllowance(sov_new.address, DECI_NEW);
    await sov_old.increaseAllowance(sov_new.address, DECI_OLD);
    expect(await sov_old.balanceOf(A0)).to.eq(DECI_OLD);
    expect(await sov_new.balanceOf(A0)).to.eq(0);
    await sov_new.migrate(DECI_OLD, [0, 0]);
    expect(await sov_old.balanceOf(A0)).to.eq(0);
    expect(await sov_new.balanceOf(A0)).to.eq(DECI_NEW);
  });
  it("should *not* migrate old (migration sealed)", async function () {
    await sov_new.grantRole(sov_new.SOV_SEAL_ROLE(), A0);
    expect(await sov_new.seals()).to.deep.eq([false]);
    await sov_new.seal(0);
    expect(await sov_new.seals()).to.deep.eq([true]);
    await sov_new.sealAll();
    expect(await sov_new.seals()).to.deep.eq([true]);
    await sov_old.increaseAllowance(sov_new.address, DECI_OLD);
    const tx = await sov_new.migrate(DECI_OLD, [0, 0]).catch((ex) => {
      const m = ex.message.match(/migration sealed/);
      if (m === null) console.debug(ex);
      expect(m).to.be.not.null;
    });
    expect(tx).to.eq(undefined);
    const new_migrated = await sov_new.migrated();
    expect(new_migrated).to.eq(0);
  });
  it("should *not* seal new (missing role)", async function () {
    const tx = await sov_new.seal(0).catch((ex) => {
      const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
      if (m === null) console.debug(ex);
      expect(m).to.be.not.null;
    });
    expect(tx).to.eq(undefined);
    const new_migrated = await sov_new.migrated();
    expect(new_migrated).to.eq(0);
  });
  it("should *not* migrate old (deadline passed)", async function () {
    await network.provider.send("evm_increaseTime", [126_230_400]);
    await sov_old.increaseAllowance(sov_new.address, DECI_OLD);
    const tx = await sov_new.migrate(DECI_OLD, [0, 0]).catch((ex) => {
      const m = ex.message.match(/deadline passed/);
      if (m === null) console.debug(ex);
      expect(m).to.be.not.null;
    });
    expect(tx).to.eq(undefined);
    const new_migrated = await sov_new.migrated();
    expect(new_migrated).to.eq(0);
  });
  describe("oldIndexOf", async function () {
    it("should return index=0", async function () {
      const index = await sov_new.oldIndexOf(sov_old.address);
      expect(index).to.eq(0);
    });
  });
});
async function mintToken(amount) {
  const tx_mint = await moe_old.fake(A0, amount);
  expect(tx_mint).to.be.an("object");
  const balance_0 = await moe_old.balanceOf(A0);
  expect(balance_0).to.be.gte(amount);
  const balance_1 = await moe_old.balanceOf(A1);
  expect(balance_1).to.eq(0);
}
async function increaseAllowanceBy(amount, spender) {
  const tx_increase = await moe_old.increaseAllowance(spender, amount);
  expect(tx_increase).to.be.an("object");
  const allowance = await moe_old.allowance(A0, spender);
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
  const [account, address] = [A0, nty.address];
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
