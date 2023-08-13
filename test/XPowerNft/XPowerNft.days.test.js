const { ethers, network } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Nft; // contracts
let moe, nft; // instances

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
const DEADLINE = 0; // [seconds]

const moment = require("moment");

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
    Moe = await ethers.getContractFactory("XPower");
    expect(Moe).to.be.an("object");
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.be.an("object");
  });
  before(async function () {
    moe = await Moe.deploy([], DEADLINE);
    expect(moe).to.be.an("object");
    await moe.transferOwnership(addresses[1]);
    await moe.init();
  });
  before(async function () {
    nft = await Nft.deploy(moe.target, NFT_XPOW_URL, [], DEADLINE);
    expect(nft).to.be.an("object");
  });
  after(async function () {
    const [owner, signer_1] = await ethers.getSigners();
    await moe.connect(signer_1).transferOwnership(owner.address);
  });
  describe("year (by days)", async function () {
    beforeEach(async () => {
      await network.provider.send("evm_increaseTime", [86400]);
      await network.provider.send("evm_mine");
    });
    for (const dd of range(0, 365)) {
      const utc_date = moment().add(dd, "days");
      const iso_date = utc_date.toISOString();
      const pad_days = String(dd).padStart(3, "0");
      it(`should match current UTC year + ${pad_days} days: ${iso_date}`, async () => {
        await check_day(utc_date);
      });
    }
  });
});
async function check_day(utc_date) {
  const nft_year = await nft.year();
  expect(nft_year).to.be.greaterThan(0);
  if (utc_date.dayOfYear() === 1 || utc_date.dayOfYear() === 365) {
    expect(nft_year).to.approximately(utc_date.year(), 1);
  } else {
    expect(nft_year).to.eq(utc_date.year());
  }
}
function* range(start, end) {
  for (let i = start; i < end; i++) {
    yield i;
  }
}
