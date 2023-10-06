const { ethers } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let Moe, Nft; // contract
let moe, nft; // instance
let UNIT; // decimals

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";

describe("XPowerNft", async function () {
  before(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
  });
  before(async function () {
    Moe = await ethers.getContractFactory("XPowerTest");
    expect(Moe).to.be.an("object");
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.be.an("object");
  });
  beforeEach(async function () {
    moe = await Moe.deploy([], 0);
    expect(moe).to.be.an("object");
    await moe.transferOwnership(accounts[1]);
    await moe.init();
  });
  beforeEach(async function () {
    const decimals = await moe.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.eq(true);
  });
  beforeEach(async function () {
    nft = await Nft.deploy(moe.target, NFT_XPOW_URL, [], 0);
    expect(nft).to.be.an("object");
  });
  after(async function () {
    const [owner, signer_1] = await ethers.getSigners();
    await moe.connect(signer_1).transferOwnership(owner.address);
  });
  describe("mint", async function () {
    it("should mint XPower for amount=15", async function () {
      await moeMint(15);
    });
    it("should increase XPower allowance by amount=15", async function () {
      await allowanceOf(15);
    });
    it("should mint NFTs for level=UNIT & amount=15", async function () {
      await moeMint(15);
      await allowanceOf(15);
      await nftMint(15);
    });
    it("should *not* mint NFTs (non-ternary level)", async function () {
      expect(
        await nftMint(1, 2).catch((ex) => {
          const m = ex.message.match(/non-ternary level/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
    it("should *not* mint NFTs (transfer amount exceeds balance)", async function () {
      await allowanceOf(15);
      expect(
        await nftMint(15).catch((ex) => {
          const m = ex.message.match(/transfer amount exceeds balance/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
    it("should *not* mint NFTs (insufficient allowance)", async function () {
      expect(
        await nftMint(15).catch((ex) => {
          const m = ex.message.match(/insufficient allowance/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
    it("should mint NFTs for level=UNIT & amount=15 (other)", async function () {
      const [owner, other] = [accounts[0], accounts[1]];
      await moeMint(15);
      await allowanceOf(15);
      await nftApprove(owner, other);
      await nftMint(15, 0, owner, other);
    });
    it("should *not* mint NFTs (other: not approved)", async function () {
      const [owner, other] = [accounts[0], accounts[1]];
      expect(
        await nftMint(15, 0, owner, other).catch((ex) => {
          const m = ex.message.match(/caller is not token owner or approved/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
  });
  describe("mint-batch", async function () {
    it("should mint XPower for amount=15", async function () {
      await moeMint(15);
    });
    it("should increase XPower allowance by amount=15", async function () {
      await allowanceOf(15);
    });
    it("should mint NFTs for level=UNIT & amount=15", async function () {
      await moeMint(15);
      await allowanceOf(15);
      await nftMintBatch(15);
    });
    it("should *not* mint NFTs (non-ternary leve)", async function () {
      expect(
        await nftMintBatch(1, 2).catch((ex) => {
          const m = ex.message.match(/non-ternary level/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
    it("should *not* mint NFTs (transfer amount exceeds balance)", async function () {
      await allowanceOf(15);
      expect(
        await nftMintBatch(15).catch((ex) => {
          const m = ex.message.match(/transfer amount exceeds balance/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
    it("should *not* mint NFTs (insufficient allowance)", async function () {
      expect(
        await nftMintBatch(15).catch((ex) => {
          const m = ex.message.match(/insufficient allowance/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
    it("should mint NFTs for level=UNIT & amount=15 (other)", async function () {
      const [owner, other] = [accounts[0], accounts[1]];
      await moeMint(15);
      await allowanceOf(15);
      await nftApprove(owner, other);
      await nftMintBatch(15, 0, owner, other);
    });
    it("should *not* mint NFTs (other: not approved)", async function () {
      const [owner, other] = [accounts[0], accounts[1]];
      expect(
        await nftMintBatch(15, 0, owner, other).catch((ex) => {
          const m = ex.message.match(/caller is not token owner or approved/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
  });
});
async function allowanceOf(n, a = accounts[0]) {
  if (typeof n !== "bigint") n = BigInt(n);
  const tx = await moe.connect(a).increaseAllowance(nft.target, n * UNIT);
  expect(tx).to.be.an("object");
}
async function moeMint(n, a = accounts[0]) {
  const tx = await moe.connect(a).fake(a.address, BigInt(n) * UNIT);
  expect(tx).to.be.an("object");
  return tx;
}
async function nftApprove(a = accounts[0], d = accounts[1]) {
  expect(await nft.approvedMint(a, d)).to.eq(false);
  const tx = await nft.approveMint(d, true);
  expect(tx).to.be.an("object");
  expect(await nft.approvedMint(a, d)).to.eq(true);
  return tx;
}
async function nftMint(n, l = 0, a = accounts[0], d = accounts[0]) {
  const year = await nft.year();
  expect(year).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(a);
  const tx = await nft.connect(d).mint(a, l, n);
  const new_balance = await moe.balanceOf(a.address);
  expect(old_balance - new_balance).to.eq(BigInt(n * 10 ** l) * UNIT);
  const nft_id = await nft.idBy(year, l);
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await nft.balanceOf(a, nft_id);
  expect(nft_balance).to.eq(n);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply).to.eq(n);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_XPOW_URL);
  return tx;
}
async function nftMintBatch(n, l = 0, a = accounts[0], d = accounts[0]) {
  const year = await nft.year();
  expect(year).to.be.greaterThan(0);
  const old_balance = await moe.balanceOf(a);
  const tx = await nft.connect(d).mintBatch(a, [l], [n]);
  const new_balance = await moe.balanceOf(a);
  expect(old_balance - new_balance).to.eq(BigInt(n * 10 ** l) * UNIT);
  const nft_ids = await nft.idsBy(year, [l]);
  expect(nft_ids.length).to.be.greaterThan(0);
  const nft_id = nft_ids[0];
  expect(nft_id).to.be.greaterThan(0);
  const nft_balance = await nft.balanceOf(a, nft_id);
  expect(nft_balance).to.eq(n);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply).to.eq(n);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(true);
  const nft_url = await nft.uri(nft_id);
  expect(nft_url).to.eq(NFT_XPOW_URL);
  return tx;
}
