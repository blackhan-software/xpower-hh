/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower, XPowerNft; // contracts
let xpower, xpower_nft_old, xpower_nft_new; // instances

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const NONE_ADDRESS = "0x0000000000000000000000000000000000000000";
const NFT_LOKI_URL = "https://xpowermine.com/nfts/loki/{id}.json";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years

let UNIT;

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
    const factory = await ethers.getContractFactory("XPowerLokiTest");
    const contract = await factory.deploy(NONE_ADDRESS, DEADLINE);
    table = await new HashTable(contract, addresses[0]).init();
  });
  before(async function () {
    XPowerNft = await ethers.getContractFactory("XPowerLokiNft");
    expect(XPowerNft).to.exist;
    XPower = await ethers.getContractFactory("XPowerLoki");
    expect(XPower).to.exist;
  });
  beforeEach(async function () {
    xpower = await XPower.deploy(NONE_ADDRESS, DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
    await xpower.transferOwnership(addresses[1]);
    await xpower.init();
  });
  beforeEach(async function () {
    xpower_nft_old = await XPowerNft.deploy(
      NFT_LOKI_URL,
      NONE_ADDRESS,
      DEADLINE,
      xpower.address
    );
    expect(xpower_nft_old).to.exist;
    await xpower_nft_old.deployed();
    xpower_nft_new = await XPowerNft.deploy(
      NFT_LOKI_URL,
      xpower_nft_old.address,
      DEADLINE,
      xpower.address
    );
    expect(xpower_nft_new).to.exist;
    await xpower_nft_new.deployed();
  });
  beforeEach(async function () {
    UNIT = (await xpower_nft_old.UNIT()).toNumber();
    expect(UNIT).to.be.a("number").and.to.eq(0);
  });
  after(async function () {
    const [owner, signer_1] = await ethers.getSigners();
    await xpower.connect(signer_1).transferOwnership(owner.address);
  });
  describe("migrate", async function () {
    it("should set XPower NFT approval for all", async function () {
      await setNftApprovalForAll(xpower_nft_new.address);
    });
    it("should migrate NFTs for level=UNIT & amount=1", async function () {
      await mintXPow(1);
      await increaseAllowanceBy(1);
      await mintXPowNft(UNIT, 1);
      await setNftApprovalForAll(xpower_nft_new.address);
      await migrateXPowNft(UNIT, 1);
    });
    it("should *not* migrate NFTs for level=UNIT & amount=1 (caller is not owner nor approved)", async function () {
      await mintXPow(1);
      await increaseAllowanceBy(1);
      await mintXPowNft(UNIT, 1);
      expect(
        await migrateXPowNft(UNIT, 1).catch((ex) => {
          expect(ex.message.match(/caller is not owner nor approved/)).to.be.not
            .null;
        })
      ).to.eq(undefined);
    });
    it("should *not* migrate NFTs for level=UNIT & amount=1 (burn amount exceeds totalSupply)", async function () {
      await mintXPow(1);
      await increaseAllowanceBy(1);
      await setNftApprovalForAll(xpower_nft_new.address);
      expect(
        await migrateXPowNft(UNIT, 1).catch((ex) => {
          expect(ex.message.match(/burn amount exceeds totalSupply/)).to.be.not
            .null;
        })
      ).to.eq(undefined);
    });
    it("should *not* migrate NFTs for level=UNIT & amount=1 (migration sealed)", async function () {
      await mintXPow(1);
      await increaseAllowanceBy(1);
      await mintXPowNft(UNIT, 1);
      await setNftApprovalForAll(xpower_nft_new.address);
      await xpower_nft_new.seal();
      expect(
        await migrateXPowNft(UNIT, 1).catch((ex) => {
          expect(ex.message.match(/migration sealed/)).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("migrate-batch", async function () {
    it("should set XPower NFT approval for all", async function () {
      await setNftApprovalForAll(xpower_nft_new.address);
    });
    it("should migrate-batch NFTs for level=UNIT & amount=1", async function () {
      await mintXPow(1);
      await increaseAllowanceBy(1);
      await mintBatchXPowNft(UNIT, 1);
      await setNftApprovalForAll(xpower_nft_new.address);
      await migrateBatchXPowNft(UNIT, 1);
    });
    it("should *not* migrate-batch NFTs for level=UNIT & amount=1 (caller is not owner nor approved)", async function () {
      await mintXPow(1);
      await increaseAllowanceBy(1);
      await mintXPowNft(UNIT, 1);
      expect(
        await migrateBatchXPowNft(UNIT, 1).catch((ex) => {
          expect(ex.message.match(/caller is not owner nor approved/)).to.be.not
            .null;
        })
      ).to.eq(undefined);
    });
    it("should *not* migrate-batch NFTs for level=UNIT & amount=1 (burn amount exceeds totalSupply)", async function () {
      await mintXPow(1);
      await increaseAllowanceBy(1);
      await setNftApprovalForAll(xpower_nft_new.address);
      expect(
        await migrateBatchXPowNft(UNIT, 1).catch((ex) => {
          expect(ex.message.match(/burn amount exceeds totalSupply/)).to.be.not
            .null;
        })
      ).to.eq(undefined);
    });
    it("should *not* migrate-batch NFTs for level=UNIT & amount=1 (migration sealed)", async function () {
      await mintXPow(1);
      await increaseAllowanceBy(1);
      await mintBatchXPowNft(UNIT, 1);
      await setNftApprovalForAll(xpower_nft_new.address);
      await xpower_nft_new.seal();
      expect(
        await migrateBatchXPowNft(UNIT, 1).catch((ex) => {
          expect(ex.message.match(/migration sealed/)).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
});
async function increaseAllowanceBy(amount) {
  const [owner, spender] = [addresses[0], xpower_nft_old.address];
  const increase = await xpower.increaseAllowance(spender, amount);
  expect(increase).to.be.an("object");
  const allowance = await xpower.allowance(owner, spender);
  expect(allowance.toNumber()).to.eq(amount);
}
async function mintXPow(amount) {
  const [nonce, block_hash] = table.getNonce({ amount });
  expect(nonce.gte(0)).to.eq(true);
  const tx = await xpower.mint(addresses[0], block_hash, nonce);
  expect(tx).to.be.an("object");
  expect(await xpower.balanceOf(addresses[0])).to.eq(amount);
  expect(await xpower.balanceOf(addresses[1])).to.eq(Math.floor(amount / 2));
}
async function mintXPowNft(unit, amount) {
  const year = (await xpower_nft_old.year()).toNumber();
  expect(year).to.be.greaterThan(0);
  await xpower_nft_old.mint(addresses[0], unit, amount);
  const nft_id = (await xpower_nft_old.idBy(year, unit)).toNumber();
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await xpower_nft_old.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(amount);
  const nft_supply = (await xpower_nft_old.totalSupply(nft_id)).toNumber();
  expect(nft_supply).to.eq(amount);
  const nft_exists = await xpower_nft_old.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await xpower_nft_old.uri(nft_id);
  expect(nft_url).to.eq(NFT_LOKI_URL);
}
async function mintBatchXPowNft(unit, amount) {
  const year = (await xpower_nft_old.year()).toNumber();
  expect(year).to.be.greaterThan(0);
  await xpower_nft_old.mintBatch(addresses[0], [unit], [amount]);
  const nft_ids = await xpower_nft_old.idsBy(year, [unit]);
  expect(nft_ids.length).to.be.greaterThan(0);
  const nft_id = nft_ids[0].toNumber();
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await xpower_nft_old.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(amount);
  const nft_supply = (await xpower_nft_old.totalSupply(nft_id)).toNumber();
  expect(nft_supply).to.eq(amount);
  const nft_exists = await xpower_nft_old.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await xpower_nft_old.uri(nft_id);
  expect(nft_url).to.eq(NFT_LOKI_URL);
}
async function setNftApprovalForAll(operator) {
  const set_approval = await xpower_nft_old.setApprovalForAll(operator, true);
  expect(set_approval).to.be.an("object");
  const is_approved = await xpower_nft_old.isApprovedForAll(
    addresses[0],
    operator
  );
  expect(is_approved).to.eq(true);
}
async function migrateXPowNft(unit, amount) {
  const year = await xpower_nft_new.year();
  const nft_id = await xpower_nft_new.idBy(year, unit);
  await xpower_nft_new.migrate(nft_id, amount);
  const nft_balance_v1 = await xpower_nft_old.balanceOf(addresses[0], nft_id);
  expect(nft_balance_v1.toNumber()).to.eq(0);
  const nft_balance_v2 = await xpower_nft_new.balanceOf(addresses[0], nft_id);
  expect(nft_balance_v2.toNumber()).to.eq(amount);
}
async function migrateBatchXPowNft(unit, amount) {
  const year = await xpower_nft_new.year();
  const nft_id = await xpower_nft_new.idBy(year, unit);
  await xpower_nft_new.migrateBatch([nft_id], [amount]);
  const nft_balance_v1 = await xpower_nft_old.balanceOf(addresses[0], nft_id);
  expect(nft_balance_v1.toNumber()).to.eq(0);
  const nft_balance_v2 = await xpower_nft_new.balanceOf(addresses[0], nft_id);
  expect(nft_balance_v2.toNumber()).to.eq(amount);
}
