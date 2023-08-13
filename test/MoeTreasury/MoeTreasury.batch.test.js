const { ethers, network } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Sov, Nft, Ppt, Mty, Nty; // contracts
let moe, sov, nft, ppt, mty, nty; // instances
let UNIT; // decimals

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
const DEADLINE = 126_230_400; // [seconds] i.e. 4 years
const DAYS = 86_400; // [seconds]

describe("MoeTreasury", async function () {
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
    Moe = await ethers.getContractFactory("XPowerTest");
    expect(Moe).to.be.an("object");
    Sov = await ethers.getContractFactory("APower");
    expect(Sov).to.be.an("object");
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.be.an("object");
    Ppt = await ethers.getContractFactory("XPowerPpt");
    expect(Ppt).to.be.an("object");
    Mty = await ethers.getContractFactory("MoeTreasury");
    expect(Mty).to.be.an("object");
    Nty = await ethers.getContractFactory("NftTreasury");
    expect(Nty).to.be.an("object");
  });
  before(async function () {
    moe = await Moe.deploy([], DEADLINE);
    expect(moe).to.be.an("object");
    await moe.init();
    sov = await Sov.deploy(moe.target, [], DEADLINE);
    expect(sov).to.be.an("object");
  });
  before(async function () {
    const decimals = await moe.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
  });
  before(async function () {
    nft = await Nft.deploy(moe.target, NFT_XPOW_URL, [], DEADLINE);
    expect(nft).to.be.an("object");
    ppt = await Ppt.deploy(NFT_XPOW_URL, [], DEADLINE);
    expect(ppt).to.be.an("object");
  });
  before(async function () {
    mty = await Mty.deploy(moe.target, sov.target, ppt.target);
    expect(mty).to.be.an("object");
    nty = await Nty.deploy(nft.target, ppt.target, mty.target);
    expect(nty).to.be.an("object");
  });
  before(async function () {
    await sov.transferOwnership(mty.target);
    expect(await sov.owner()).to.eq(mty.target);
  });
  before(async function () {
    await mintToken(1110n * UNIT);
    const supply = await moe.totalSupply();
    await increaseAllowanceBy(supply, nft.target);
  });
  before(async function () {
    await moe.transfer(mty.target, 32n * UNIT);
  });
  describe("moeBalance", async function () {
    it("should return 32 [XPOW]", async function () {
      expect(await moe.balanceOf(mty.target)).to.eq(32n * UNIT);
    });
  });
  describe("claimBatch", async function () {
    it("should return 32 [XPOW] in 36 months", async function () {
      const [account, nft_id] = await stakeNft(await mintNft(3, 1), 1);
      expect(
        await mty.claimBatch(account, [nft_id, nft_id]).catch((ex) => {
          const m = ex.message.match(/unsorted or duplicate ids/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
      expect(
        await mty.claimBatch(account, [nft_id]).catch((ex) => {
          const m = ex.message.match(/nothing claimable/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
      Expect(await mty.rewardOfBatch(account, [nft_id])).to.eq([0n]);
      Expect(await mty.claimedBatch(account, [nft_id])).to.eq([0n]);
      Expect(await mty.claimableBatch(account, [nft_id])).to.eq([0n]);
      expect(await moe.balanceOf(mty.target)).to.eq(32n * UNIT);
      // wait for +6 months:
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 0.5]);
      expect(await mty.claimBatch(account, [nft_id])).to.be.an("object");
      Expect(await mty.rewardOfBatch(account, [nft_id])).to.eq([UNIT * 5n]);
      Expect(await mty.claimedBatch(account, [nft_id])).to.eq([UNIT * 5n]);
      Expect(await mty.claimableBatch(account, [nft_id])).to.eq([0n]);
      expect(await moe.balanceOf(mty.target)).to.eq(27n * UNIT);
      // wait for +6 months:
      await network.provider.send("evm_increaseTime", [465.25 * DAYS * 0.5]);
      expect(await mty.claimBatch(account, [nft_id])).to.be.an("object");
      Expect(await mty.rewardOfBatch(account, [nft_id])).to.eq([UNIT * 11n]);
      Expect(await mty.claimedBatch(account, [nft_id])).to.eq([UNIT * 11n]);
      Expect(await mty.claimableBatch(account, [nft_id])).to.eq([0n]);
      expect(await moe.balanceOf(mty.target)).to.eq(21n * UNIT);
      // wait for +4 months:
      await network.provider.send("evm_increaseTime", [
        Math.round(365.25 * DAYS * 0.334),
      ]);
      expect(await mty.claimBatch(account, [nft_id])).to.be.an("object");
      Expect(await mty.rewardOfBatch(account, [nft_id])).to.eq([UNIT * 15n]);
      Expect(await mty.claimedBatch(account, [nft_id])).to.eq([UNIT * 15n]);
      Expect(await mty.claimableBatch(account, [nft_id])).to.eq([0n]);
      expect(await moe.balanceOf(mty.target)).to.eq(17n * UNIT);
      // wait for +8 months:
      await network.provider.send("evm_increaseTime", [
        Math.round(365.25 * DAYS * 0.667),
      ]);
      expect(await mty.claimBatch(account, [nft_id])).to.be.an("object");
      Expect(await mty.rewardOfBatch(account, [nft_id])).to.eq([UNIT * 21n]);
      Expect(await mty.claimedBatch(account, [nft_id])).to.eq([UNIT * 21n]);
      Expect(await mty.claimableBatch(account, [nft_id])).to.eq([0n]);
      expect(await moe.balanceOf(mty.target)).to.eq(11n * UNIT);
      // wait for +12 months:
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mty.claimBatch(account, [nft_id])).to.be.an("object");
      Expect(await mty.rewardOfBatch(account, [nft_id])).to.eq([UNIT * 32n]);
      Expect(await mty.claimedBatch(account, [nft_id])).to.eq([UNIT * 32n]);
      Expect(await mty.claimableBatch(account, [nft_id])).to.eq([0n]);
      expect(await moe.balanceOf(mty.target)).to.eq(0);
      // wait for +12 months: (empty treasury)
      await network.provider.send("evm_increaseTime", [365.25 * DAYS * 1.0]);
      expect(await mty.claimBatch(account, [nft_id])).to.be.an("object");
      Expect(await mty.rewardOfBatch(account, [nft_id])).to.eq([UNIT * 43n]);
      Expect(await mty.claimedBatch(account, [nft_id])).to.eq([UNIT * 43n]);
      Expect(await mty.claimableBatch(account, [nft_id])).to.eq([UNIT * 0n]);
      expect(await moe.balanceOf(mty.target)).to.eq(0);
    });
  });
});
async function mintToken(amount) {
  const tx_mint = await moe.fake(addresses[0], amount);
  expect(tx_mint).to.be.an("object");
  const balance_0 = await moe.balanceOf(addresses[0]);
  expect(balance_0).to.be.gte(amount);
  const balance_1 = await moe.balanceOf(addresses[1]);
  expect(balance_1).to.eq(0);
}
async function increaseAllowanceBy(amount, spender) {
  const tx_increase = await moe.increaseAllowance(spender, amount);
  expect(tx_increase).to.be.an("object");
  const allowance = await moe.allowance(addresses[0], spender);
  expect(allowance).to.eq(amount);
}
async function mintNft(level, amount) {
  const nft_id = await nft.idBy(await nft.year(), level);
  expect(nft_id).to.be.gt(0);
  const tx_mint = await nft.mint(addresses[0], level, amount);
  expect(tx_mint).to.be.an("object");
  const nft_balance = await nft.balanceOf(addresses[0], nft_id);
  expect(nft_balance).to.eq(amount);
  const nft_supply = await nft.totalSupply(nft_id);
  expect(nft_supply).to.eq(amount);
  const nft_exists = await nft.exists(nft_id);
  expect(nft_exists).to.eq(nft_balance > 0);
  return nft_id;
}
async function stakeNft(nft_id, amount) {
  const [account, address] = [addresses[0], nty.target];
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
  expect(nft_balance).to.eq(nft_balance_old - BigInt(amount));
  return [account, nft_id];
}
function Expect(array) {
  return expect(array.map((n) => BigInt(n))).deep;
}
