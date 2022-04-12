/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower, XPowerNft; // contracts
let xpower, xpower_nft; // instances

const NONE_ADDRESS = "0x0000000000000000000000000000000000000000";
const NFT_AQCH_URL = "https://xpowermine.com/nfts/aqch/{id}.json";
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
    XPowerNft = await ethers.getContractFactory("XPowerAqchNft");
    expect(XPowerNft).to.exist;
    XPower = await ethers.getContractFactory("XPowerAqch");
    expect(XPower).to.exist;
  });
  before(async function () {
    xpower = await XPower.deploy(NONE_ADDRESS, DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
    await xpower.transferOwnership(addresses[1]);
    await xpower.init();
  });
  before(async function () {
    xpower_nft = await XPowerNft.deploy(
      NFT_AQCH_URL,
      NONE_ADDRESS,
      DEADLINE,
      xpower.address
    );
    expect(xpower_nft).to.exist;
    await xpower_nft.deployed();
  });
  after(async function () {
    const [owner, signer_1] = await ethers.getSigners();
    await xpower.connect(signer_1).transferOwnership(owner.address);
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
  const nft_year = (await xpower_nft.year()).toNumber();
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
