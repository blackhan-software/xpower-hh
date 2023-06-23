/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Nft; // contracts
let moe_old, nft_old; // instances
let moe_new, nft_new; // instances
let UNIT; // decimals

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const NFT_LOKI_URL = "https://xpowermine.com/nfts/loki/{id}.json";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years
const DAYS = 86_400; // [seconds]

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
    moe_old = await Moe.deploy([], DEADLINE);
    expect(moe_old).to.exist;
    await moe_old.deployed();
    await moe_old.transferOwnership(addresses[1]);
    await moe_old.init();
    moe_new = await Moe.deploy([moe_old.address], DEADLINE);
    expect(moe_new).to.exist;
    await moe_new.deployed();
    await moe_new.transferOwnership(addresses[1]);
    await moe_new.init();
  });
  beforeEach(async function () {
    table = await new HashTable(moe_old, addresses[0]).init();
  });
  beforeEach(async function () {
    const decimals = await moe_old.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.be.true;
  });
  beforeEach(async function () {
    nft_old = await Nft.deploy(NFT_LOKI_URL, [moe_old.address], [], DEADLINE);
    expect(nft_old).to.exist;
    await nft_old.deployed();
    nft_new = await Nft.deploy(
      NFT_LOKI_URL,
      [moe_new.address],
      [nft_old.address],
      DEADLINE
    );
    expect(nft_new).to.exist;
    await nft_new.deployed();
  });
  after(async function () {
    const [owner, signer_1] = await ethers.getSigners();
    await moe_old.connect(signer_1).transferOwnership(owner.address);
    await moe_new.connect(signer_1).transferOwnership(owner.address);
  });
  describe("oldIndexOf", async function () {
    it("should return index=0", async function () {
      const index = await nft_new.oldIndexOf(nft_old.address);
      expect(index).to.eq(0);
    });
  });
  describe("migrate", async function () {
    it("should set XPower NFT approval for all", async function () {
      await nftApprove(nft_new.address);
    });
    it("should migrate NFTs for level=UNIT & amount=1", async function () {
      await moeMint(1);
      await allowanceOf(1);
      await nftMint(1);
      await nftApprove(nft_new.address);
      await checkBalances([UNIT, 0, 0, 0]);
      await nftMigrate(1);
      await checkBalances([0, 0, 0, UNIT]);
    });
    it("should *not* migrate NFTs for level=UNIT & amount=1 (caller is not token owner or approved)", async function () {
      await moeMint(1);
      await allowanceOf(1);
      await nftMint(1);
      await checkBalances([UNIT, 0, 0, 0]);
      expect(
        await nftMigrate(1).catch((ex) => {
          const m = ex.message.match(/caller is not token owner or approved/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      await checkBalances([UNIT, 0, 0, 0]);
    });
    it("should *not* migrate NFTs for level=UNIT & amount=1 (burn amount exceeds totalSupply)", async function () {
      await moeMint(1);
      await allowanceOf(1);
      await nftApprove(nft_new.address);
      await checkBalances([0, 0, 0, 0]);
      expect(
        await nftMigrate(1).catch((ex) => {
          const m = ex.message.match(/burn amount exceeds totalSupply/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      await checkBalances([0, 0, 0, 0]);
    });
    it("should *not* migrate NFTs for level=UNIT & amount=1 (migration sealed)", async function () {
      await moeMint(1);
      await allowanceOf(1);
      await nftMint(1);
      await nftApprove(nft_new.address);
      await nft_new.grantRole(nft_new.NFT_SEAL_ROLE(), addresses[0]);
      expect(await nft_new.seals()).to.deep.eq([false]);
      await nft_new.sealAll();
      expect(await nft_new.seals()).to.deep.eq([true]);
      await checkBalances([UNIT, 0, 0, 0]);
      expect(
        await nftMigrate(1).catch((ex) => {
          const m = ex.message.match(/migration sealed/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      await checkBalances([UNIT, 0, 0, 0]);
    });
  });
  describe("migrate-batch", async function () {
    it("should set XPower NFT approval for all", async function () {
      await nftApprove(nft_new.address);
    });
    it("should migrate-batch NFTs for level=UNIT & amount=1", async function () {
      await moeMint(1);
      await allowanceOf(1);
      await nftMintBatch(1);
      await nftApprove(nft_new.address);
      await checkBalances([UNIT, 0, 0, 0]);
      await nftMigrateBatch(1);
      await checkBalances([0, 0, 0, UNIT]);
    });
    it("should *not* migrate-batch NFTs for level=UNIT & amount=1 (caller is not token owner or approved)", async function () {
      await moeMint(1);
      await allowanceOf(1);
      await nftMint(1);
      await checkBalances([UNIT, 0, 0, 0]);
      expect(
        await nftMigrateBatch(1).catch((ex) => {
          const m = ex.message.match(/caller is not token owner or approved/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      await checkBalances([UNIT, 0, 0, 0]);
    });
    it("should *not* migrate-batch NFTs for level=UNIT & amount=1 (burn amount exceeds totalSupply)", async function () {
      await moeMint(1);
      await allowanceOf(1);
      await nftApprove(nft_new.address);
      await checkBalances([0, 0, 0, 0]);
      expect(
        await nftMigrateBatch(1).catch((ex) => {
          const m = ex.message.match(/burn amount exceeds totalSupply/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      await checkBalances([0, 0, 0, 0]);
    });
    it("should *not* migrate-batch NFTs for level=UNIT & amount=1 (migration sealed)", async function () {
      await moeMint(1);
      await allowanceOf(1);
      await nftMintBatch(1);
      await nftApprove(nft_new.address);
      await nft_new.grantRole(nft_new.NFT_SEAL_ROLE(), addresses[0]);
      await nft_new.seal(0);
      await checkBalances([UNIT, 0, 0, 0]);
      expect(
        await nftMigrateBatch(1).catch((ex) => {
          const m = ex.message.match(/migration sealed/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      await checkBalances([UNIT, 0, 0, 0]);
    });
  });
});
async function allowanceOf(n) {
  expect(
    await moe_old.increaseAllowance(nft_old.address, BigInt(n) * UNIT)
  ).to.be.an("object");
  expect(
    await moe_old.increaseAllowance(moe_new.address, BigInt(n) * UNIT)
  ).to.be.an("object");
  expect(
    await moe_new.increaseAllowance(nft_new.address, BigInt(n) * UNIT)
  ).to.be.an("object");
}
async function moeMint(n) {
  const [nonce, block_hash] = table.getNonce({ amount: n });
  expect(nonce.gte(0)).to.eq(true);
  const tx = await moe_old.mint(addresses[0], block_hash, nonce);
  expect(tx).to.be.an("object");
  expect(await moe_old.balanceOf(addresses[0])).to.eq((BigInt(n) * UNIT) / 1n);
  expect(await moe_old.balanceOf(addresses[1])).to.eq((BigInt(n) * UNIT) / 2n);
}
async function nftMint(n, l = 0) {
  const year = (await nft_old.year()).toNumber();
  expect(year).to.be.greaterThan(0);
  const moe_index = await nft_old.moeIndexOf(moe_old.address);
  await nft_old.mint(addresses[0], l, n, moe_index);
  const moe_prefix = await moe_old.prefix();
  const nft_id = (await nft_old.idBy(year, l, moe_prefix)).toNumber();
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await nft_old.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(n);
  const nft_supply = await nft_old.totalSupply(nft_id);
  expect(nft_supply).to.eq(n);
  const nft_exists = await nft_old.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await nft_old.uri(nft_id);
  expect(nft_url).to.eq(NFT_LOKI_URL);
}
async function nftMintBatch(n, l = 0) {
  const year = (await nft_old.year()).toNumber();
  expect(year).to.be.greaterThan(0);
  const moe_index = await nft_old.moeIndexOf(moe_old.address);
  await nft_old.mintBatch(addresses[0], [l], [n], moe_index);
  const moe_prefix = await moe_old.prefix();
  const nft_ids = await nft_old.idsBy(year, [l], moe_prefix);
  expect(nft_ids.length).to.be.greaterThan(0);
  const nft_id = nft_ids[0].toNumber();
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await nft_old.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(n);
  const nft_supply = (await nft_old.totalSupply(nft_id)).toNumber();
  expect(nft_supply).to.eq(n);
  const nft_exists = await nft_old.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await nft_old.uri(nft_id);
  expect(nft_url).to.eq(NFT_LOKI_URL);
}
async function nftApprove(op) {
  const set_approval = await nft_old.setApprovalForAll(op, true);
  expect(set_approval).to.be.an("object");
  const is_approved = await nft_old.isApprovedForAll(addresses[0], op);
  expect(is_approved).to.eq(true);
}
async function nftMigrate(n, l = 0) {
  const year = await nft_new.year();
  const moe_prefix = await moe_old.prefix();
  const nft_id = await nft_new.idBy(year, l, moe_prefix);
  const nft_index = await nft_new.oldIndexOf(nft_old.address);
  const moe_index = await moe_new.oldIndexOf(moe_old.address);
  const tx0 = await nft_old.grantRole(nft_old.NFT_OPEN_ROLE(), addresses[0]);
  expect(tx0).to.be.an("object");
  const tx1 = await nft_old["migratable(bool)"](true);
  expect(tx1).to.be.an("object");
  expect(await nft_old["migratable()"]()).to.eq(false);
  await network.provider.send("evm_increaseTime", [7 * DAYS]);
  await network.provider.send("evm_mine", []);
  expect(await nft_old["migratable()"]()).to.eq(true);
  const tx2 = await nft_new.migrate(nft_id, n, [nft_index, moe_index]);
  const nft_balance_old = await nft_old.balanceOf(addresses[0], nft_id);
  expect(nft_balance_old.toNumber()).to.eq(0);
  const nft_balance_new = await nft_new.balanceOf(addresses[0], nft_id);
  expect(nft_balance_new.toNumber()).to.eq(n);
  return tx2;
}
async function nftMigrateBatch(n, l = 0) {
  const year = await nft_new.year();
  const moe_prefix = await moe_old.prefix();
  const nft_id = await nft_new.idBy(year, l, moe_prefix);
  const nft_index = await nft_new.oldIndexOf(nft_old.address);
  const moe_index = await moe_new.oldIndexOf(moe_old.address);
  const tx0 = await nft_old.grantRole(nft_old.NFT_OPEN_ROLE(), addresses[0]);
  expect(tx0).to.be.an("object");
  const tx1 = await nft_old["migratable(bool)"](true);
  expect(tx1).to.be.an("object");
  expect(await nft_old["migratable()"]()).to.eq(false);
  await network.provider.send("evm_increaseTime", [7 * DAYS]);
  await network.provider.send("evm_mine", []);
  expect(await nft_old["migratable()"]()).to.eq(true);
  const tx2 = await nft_new.migrateBatch([nft_id], [n], [nft_index, moe_index]);
  const nft_balance_old = await nft_old.balanceOf(addresses[0], nft_id);
  expect(nft_balance_old.toNumber()).to.eq(0);
  const nft_balance_new = await nft_new.balanceOf(addresses[0], nft_id);
  expect(nft_balance_new.toNumber()).to.eq(n);
  return tx2;
}
async function checkBalances([n_oo, n_on, n_no, n_nn]) {
  // check old balances
  const moe_balance_oo = await moe_old.balanceOf(nft_old.address);
  expect(moe_balance_oo.toBigInt()).to.eq(BigInt(n_oo));
  const moe_balance_on = await moe_old.balanceOf(nft_new.address);
  expect(moe_balance_on.toBigInt()).to.eq(BigInt(n_on));
  // check new balances
  const moe_balance_no = await moe_new.balanceOf(nft_old.address);
  expect(moe_balance_no.toBigInt()).to.eq(BigInt(n_no));
  const moe_balance_nn = await moe_new.balanceOf(nft_new.address);
  expect(moe_balance_nn.toBigInt()).to.eq(BigInt(n_nn));
}
