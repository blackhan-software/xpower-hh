const { ethers, network } = require("hardhat");
const { expect } = require("chai");
const { provider } = network;

let accounts; // all accounts
let addresses; // all addresses
let Moe, Sov, Nft, Ppt, Mty, Nty; // contract
let moe, sov, nft, ppt, mty, nty; // instance
let UNIT; // decimals

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
const YEAR = 365.25 * 86_400; // [seconds]

describe("MoeTreasury", async function () {
  before(async function () {
    await provider.send("hardhat_reset");
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
    moe = await Moe.deploy([], 0);
    expect(moe).to.be.an("object");
    await moe.init();
    sov = await Sov.deploy(moe.target, [], 0);
    expect(sov).to.be.an("object");
  });
  before(async function () {
    const decimals = await moe.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
  });
  before(async function () {
    nft = await Nft.deploy(moe.target, NFT_XPOW_URL, [], 0);
    expect(nft).to.be.an("object");
    ppt = await Ppt.deploy(NFT_XPOW_URL, [], 0);
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
    await mintToken(1102n * UNIT);
    const supply = await moe.totalSupply();
    await increaseAllowanceBy(supply, nft.target);
  });
  before(async function () {
    await moe.transfer(mty.target, 102n * UNIT);
  });
  describe("moeBalance", async function () {
    it("should return 102 [XPOW]", async function () {
      expect(await moe.balanceOf(mty.target)).to.closeTo(102n * UNIT, UNIT);
    });
  });
  describe("claimBatch", async function () {
    it("should return 136 [APOW] in 36 months", async function () {
      const [a, id] = await stakeNft(await mintNft(3, 1), 1);
      expect(
        await mty.claimBatch(a, [id, id]).catch((ex) => {
          const m = ex.message.match(/unsorted or duplicate ids/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
      expect(await mty.claimBatch(a, [id])).to.be.an("object");
      expect((await mty.rewardOfBatch(a, [id]))[0]).to.lt(UNIT);
      expect((await mty.claimedBatch(a, [id]))[0]).to.lt(UNIT);
      expect((await mty.claimableBatch(a, [id]))[0]).to.lt(UNIT);
      expect((await mty.mintedBatch(a, [id]))[0]).to.lt(UNIT);
      expect((await mty.mintableBatch(a, [id]))[0]).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.gt(101n * UNIT);
      expect(await moe.balanceOf(mty.target)).to.lt(102n * UNIT);
      // wait for +6 months:
      await provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claimBatch(a, [id])).to.be.an("object");
      expect((await mty.rewardOfBatch(a, [id]))[0]).to.gt(16n * UNIT);
      expect((await mty.rewardOfBatch(a, [id]))[0]).to.lt(17n * UNIT);
      expect((await mty.claimedBatch(a, [id]))[0]).to.gt(16n * UNIT);
      expect((await mty.claimedBatch(a, [id]))[0]).to.lt(17n * UNIT);
      expect((await mty.claimableBatch(a, [id]))[0]).to.lt(UNIT);
      expect((await mty.mintedBatch(a, [id]))[0]).to.gt(262_980n * UNIT);
      expect((await mty.mintedBatch(a, [id]))[0]).to.lt(262_981n * UNIT);
      expect((await mty.mintableBatch(a, [id]))[0]).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.gt(85n * UNIT);
      expect(await moe.balanceOf(mty.target)).to.lt(86n * UNIT);
      // wait for +6 months:
      await provider.send("evm_increaseTime", [YEAR * 0.5]);
      expect(await mty.claimBatch(a, [id])).to.be.an("object");
      expect((await mty.rewardOfBatch(a, [id]))[0]).to.gt(33n * UNIT);
      expect((await mty.rewardOfBatch(a, [id]))[0]).to.lt(34n * UNIT);
      expect((await mty.claimedBatch(a, [id]))[0]).to.gt(33n * UNIT);
      expect((await mty.claimedBatch(a, [id]))[0]).to.lt(34n * UNIT);
      expect((await mty.claimableBatch(a, [id]))[0]).to.lt(UNIT);
      expect((await mty.mintedBatch(a, [id]))[0]).to.gt(525_960n * UNIT);
      expect((await mty.mintedBatch(a, [id]))[0]).to.lt(525_961n * UNIT);
      expect((await mty.mintableBatch(a, [id]))[0]).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.gt(68n * UNIT);
      expect(await moe.balanceOf(mty.target)).to.lt(69n * UNIT);
      // wait for +4 months:
      await provider.send("evm_increaseTime", [Math.round(YEAR * 0.334)]);
      expect(await mty.claimBatch(a, [id])).to.be.an("object");
      expect((await mty.rewardOfBatch(a, [id]))[0]).to.gt(45n * UNIT);
      expect((await mty.rewardOfBatch(a, [id]))[0]).to.lt(46n * UNIT);
      expect((await mty.claimedBatch(a, [id]))[0]).to.gt(45n * UNIT);
      expect((await mty.claimedBatch(a, [id]))[0]).to.lt(46n * UNIT);
      expect((await mty.claimableBatch(a, [id]))[0]).to.lt(UNIT);
      expect((await mty.mintedBatch(a, [id]))[0]).to.gt(703_180n * UNIT);
      expect((await mty.mintedBatch(a, [id]))[0]).to.lt(703_181n * UNIT);
      expect((await mty.mintableBatch(a, [id]))[0]).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.gt(56n * UNIT);
      expect(await moe.balanceOf(mty.target)).to.lt(57n * UNIT);
      // wait for +8 months:
      await provider.send("evm_increaseTime", [Math.round(YEAR * 0.667)]);
      expect(await mty.claimBatch(a, [id])).to.be.an("object");
      expect((await mty.rewardOfBatch(a, [id]))[0]).to.gt(67n * UNIT);
      expect((await mty.rewardOfBatch(a, [id]))[0]).to.lt(68n * UNIT);
      expect((await mty.claimedBatch(a, [id]))[0]).to.gt(67n * UNIT);
      expect((await mty.claimedBatch(a, [id]))[0]).to.lt(68n * UNIT);
      expect((await mty.claimableBatch(a, [id]))[0]).to.lt(UNIT);
      expect((await mty.mintedBatch(a, [id]))[0]).to.gt(1_053_995n * UNIT);
      expect((await mty.mintedBatch(a, [id]))[0]).to.lt(1_053_996n * UNIT);
      expect((await mty.mintableBatch(a, [id]))[0]).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.gt(34n * UNIT);
      expect(await moe.balanceOf(mty.target)).to.lt(35n * UNIT);
      // wait for +12 months:
      await provider.send("evm_increaseTime", [YEAR]);
      expect(await mty.claimBatch(a, [id])).to.be.an("object");
      expect((await mty.rewardOfBatch(a, [id]))[0]).to.gt(102n * UNIT);
      expect((await mty.rewardOfBatch(a, [id]))[0]).to.lt(103n * UNIT);
      expect((await mty.claimedBatch(a, [id]))[0]).to.gt(102n * UNIT);
      expect((await mty.claimedBatch(a, [id]))[0]).to.lt(103n * UNIT);
      expect((await mty.claimableBatch(a, [id]))[0]).to.lt(UNIT);
      expect((await mty.mintedBatch(a, [id]))[0]).to.gt(1_583_046n * UNIT);
      expect((await mty.mintedBatch(a, [id]))[0]).to.lt(1_583_047n * UNIT);
      expect((await mty.mintableBatch(a, [id]))[0]).to.lt(UNIT);
      expect(await moe.balanceOf(mty.target)).to.eq(0);
      // wait for +12 months: (empty treasury)
      await provider.send("evm_increaseTime", [YEAR]);
      expect(await mty.claimBatch(a, [id])).to.be.an("object");
      expect((await mty.rewardOfBatch(a, [id]))[0]).to.gt(136n * UNIT);
      expect((await mty.rewardOfBatch(a, [id]))[0]).to.lt(137n * UNIT);
      expect((await mty.claimedBatch(a, [id]))[0]).to.gt(136n * UNIT);
      expect((await mty.claimedBatch(a, [id]))[0]).to.lt(137n * UNIT);
      expect((await mty.claimableBatch(a, [id]))[0]).to.lt(UNIT);
      expect((await mty.mintedBatch(a, [id]))[0]).to.gt(2_113_628n * UNIT);
      expect((await mty.mintedBatch(a, [id]))[0]).to.lt(2_113_629n * UNIT);
      expect((await mty.mintableBatch(a, [id]))[0]).to.lt(UNIT);
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
  const tx_approval = await nft.setApprovalForAll(address, true);
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
// function Expect(array, index = undefined) {
//   if (typeof index === "number") {
//     return expect(array.map((n) => BigInt(n))[index]);
//   }
//   return expect(array.map((n) => BigInt(n))).deep;
// }
