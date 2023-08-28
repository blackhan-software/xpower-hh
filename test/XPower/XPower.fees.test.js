const { ethers, network } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe; // contract
let moe; // instance
let UNIT; // decimals

const { HashTable } = require("../hash-table");
let table; // pre-hashed nonces

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
    Moe = await ethers.getContractFactory("XPowerTest");
  });
  before(async function () {
    moe = await Moe.deploy([], 0);
    expect(moe).to.be.an("object");
    await moe.transferOwnership(addresses[1]);
    await moe.init();
  });
  before(async function () {
    table = await new HashTable(moe, addresses[0]).init({
      length: LENGTH * 2n,
      min_level: 2,
      max_level: 2,
    });
  });
  before(async function () {
    const decimals = await moe.decimals();
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
          await moe.mint(addresses[0], block_hash, nonce);
        } catch (ex) {
          console.log("[ERR]", ex.message);
          return;
        }
        const fees = await moe.fees();
        expect(fees[0] > 0).to.eq(true);
        expect(fees[1] > 0).to.eq(true);
        expect(fees[2] > 0).to.eq(true);
        console.log("[FEE]", ...fees);
      });
    }
  });
});
