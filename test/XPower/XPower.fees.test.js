const { ethers, network } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contract
let xpower; // instance
let UNIT; // decimals

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

const DEADLINE = 126_230_400; // [seconds] i.e. 4 years
const LENGTH = BigInt(process.env.RUNS ?? 16n);

describe("XPower", async function () {
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
    XPower = await ethers.getContractFactory("XPowerTest");
  });
  before(async function () {
    xpower = await XPower.deploy([], DEADLINE);
    expect(xpower).to.be.an("object");
    await xpower.transferOwnership(addresses[1]);
    await xpower.init();
  });
  before(async function () {
    table = await new HashTable(xpower, addresses[0]).init({
      length: LENGTH * 2n,
      min_level: 2,
      max_level: 2,
    });
  });
  before(async function () {
    const decimals = await xpower.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.eq(true);
  });
  describe("mint", async function () {
    for (let index = 0; index < LENGTH; index++) {
      it("should mint for amount=3", async function () {
        const [nonce, block_hash] = table.getNonce({ amount: 3, index });
        expect(nonce).to.match(/^0x[a-f0-9]+$/);
        try {
          await xpower.mint(addresses[0], block_hash, nonce);
        } catch (ex) {
          console.log("[ERR]", ex.message);
          return;
        }
        const fees = await xpower.fees();
        expect(fees[0] > 0).to.eq(true);
        expect(fees[1] > 0).to.eq(true);
        expect(fees[2] > 0).to.eq(true);
        console.log("[FEE]", ...fees);
      });
    }
  });
});
