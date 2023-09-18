const { ethers } = require("hardhat");
const { expect } = require("chai");
const PRECISION = 1_000_000_000_000n;
let UNIT; // decimals, decimals - 3

async function supplyOf(contract, delta = 0n, log = undefined) {
  const HEXA = 16n;
  let owners = 0n;
  let others = 0n;
  for (let i = 0; i < 65 + Number(delta); i++) {
    const nonce_hash = `0x${"0".repeat(i)}${"f".repeat(64 - i)}`;
    const amount = await contract.amountOf(i);
    expect(amount).to.be.gte(0);
    const weight =
      i < 64
        ? HEXA ** BigInt(64 - i) - HEXA ** BigInt(63 - i)
        : HEXA ** BigInt(64 - i);
    expect(weight).to.be.gt(0);
    if (amount) {
      const delta_full = weight * amount;
      expect(delta_full).to.be.gt(0);
      const supply_gt = others + delta_full;
      expect(supply_gt).to.be.gt(others);
      others += delta_full;
    }
    const amount_extra = (34_929n * amount) / 10n ** 6n;
    if (amount_extra) {
      const delta_half = weight * amount_extra;
      expect(delta_half).to.be.gt(0);
      const owners_gt = owners + delta_half;
      expect(owners_gt).to.be.gt(owners);
      owners += delta_half;
    }
    if (typeof log === "function") {
      if (log) log("H[", i, "] =", nonce_hash);
      if (owners) {
        const relative_inv =
          Number((amount + amount_extra) * PRECISION) / Number(amount_extra);
        const relative_pct = (100 * Number(PRECISION)) / relative_inv;
        if (log) {
          log(`#[${i}] = ${amount} & ${amount_extra} =>`, relative_pct, "%");
        }
      } else {
        if (log) log(`#[${i}] = ${amount} & ${amount_extra} =>`, 0, "%");
      }
      if (log) log("W[", i, "] =", weight);
      if (log) log("∑[", i, "] =", others);
      if (log) log("Ω[", i, "] =", owners);
      if (owners > 0) {
        const supply_inv =
          Number((others + owners) * PRECISION) / Number(owners);
        const supply_pct = (100 * Number(PRECISION)) / supply_inv;
        if (log) log("S[", i, "] =", supply_pct, "%");
      } else {
        if (log) log("S[", i, "] =", 0, "%");
      }
      if (log) log("");
    }
  }
  const total = others + owners;
  return { total, others, owners };
}

let XPower, xpower; // contract & instance
let supply; // { total, other's, fund's }

const DEADLINE = 1_814_400; // [seconds] i.e. 3 weeks

describe("XPOW Supply", async () => {
  before(async () => {
    XPower = await ethers.getContractFactory("XPowerTest");
    xpower = await XPower.deploy([], DEADLINE);
    await xpower.renounceOwnership();
  });
  beforeEach(async function () {
    const decimals = await xpower.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.eq(true);
  });
  before(async () => {
    supply = await supplyOf(xpower);
  });
  describe("calculation", async () => {
    it("should count maximum supply as 8.559756508734744e+11 × 1e64 tokens", async () => {
      expect(supply.total).to.eq(
        8559756508734743772394349710289740556191203711430480235769479063523433370898923520000000000000n,
      );
    });
    it("should count other's supply as 8.270863516951157e+11 × 1e64 tokens", async () => {
      expect(supply.others).to.eq(
        8270863516951156815969356072049136275233570333260040288531366947417101434880000000000000000000n,
      );
    });
    it("should count owner's supply as 2.888929917835870e+08 × 1e64 tokens", async () => {
      expect(supply.owners).to.eq(
        288892991783586956424993638240604280957633378170439947238112116106331936018923520000000000000n,
      );
    });
    it("should count owner's supply share as 3.375%", async () => {
      expect((100 * Number(supply.owners)) / Number(supply.total)).to.eq(
        3.375_0141314041833,
      );
    });
  });
});
