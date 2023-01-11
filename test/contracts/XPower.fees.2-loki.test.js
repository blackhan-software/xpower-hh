/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contract
let xpower; // instance
let UNIT; // decimals

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const DEADLINE = 126_230_400; // [seconds] i.e. 4 years
const LENGTH = BigInt(process.env.RUNS ?? 16n);

describe("XPowerLoki", async function () {
  before(async function () {
    await network.provider.send("hardhat_reset");
  });
  before(async function () {
    const seconds = new Date().getTime();
    const nextInterval = 3_600 * Math.ceil(seconds / 3_600);
    await network.provider.send("evm_setNextBlockTimestamp", [nextInterval]);
  });
  before(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
    addresses = accounts.map((acc) => acc.address);
    expect(addresses.length).to.be.greaterThan(1);
  });
  before(async function () {
    XPower = await ethers.getContractFactory("XPowerLokiTest");
  });
  before(async function () {
    xpower = await XPower.deploy([], DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
    await xpower.transferOwnership(addresses[1]);
    await xpower.init();
  });
  before(async function () {
    table = await new HashTable(xpower, addresses[0]).init({
      length: LENGTH,
      min_level: 2,
      max_level: 2,
    });
  });
  before(async function () {
    const decimals = await xpower.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.be.true;
  });
  describe("mint", async function () {
    for (let index = 0; index < LENGTH; index++) {
      it("should mint for amount=3", async function () {
        const [nonce, block_hash] = table.getNonce({ amount: 3, index });
        expect(nonce.gte(0)).to.eq(true);
        const tx = await xpower.mint(addresses[0], block_hash, nonce);
        expect(tx).to.be.an("object");
        const fees = (await xpower.fees()).map((f) => {
          return f.toNumber();
        });
        expect(fees[0] > 0).to.be.true;
        expect(fees[1] > 0).to.be.true;
        expect(fees[2] > 0).to.be.true;
        console.log("[FEE]", ...fees);
      });
    }
  });
});
