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
  beforeEach(async function () {
    moe = await Moe.deploy([], DEADLINE);
    expect(moe).to.be.an("object");
    await moe.transferOwnership(addresses[1]);
    await moe.init();
  });
  beforeEach(async function () {
    nft = await Nft.deploy(moe.target, NFT_XPOW_URL, [], DEADLINE);
    expect(nft).to.be.an("object");
  });
  after(async function () {
    const [owner, signer_1] = await ethers.getSigners();
    await moe.connect(signer_1).transferOwnership(owner.address);
  });
  describe("year", async function () {
    beforeEach(async () => {
      await network.provider.send("evm_increaseTime", [31_556_736]);
    });
    for (const dy of range(0, 10)) {
      it(`should match current UTC year + ${dy} years`, async () => {
        await check_year(dy);
      });
    }
  });
});
async function check_year(delta) {
  const nft_year = await nft.year();
  expect(nft_year).to.be.greaterThan(0);
  const utc_date = moment().add(delta, "years");
  expect(nft_year).to.eq(utc_date.year());
}
function* range(start, end) {
  for (let i = start; i < end; i++) {
    yield i;
  }
}
