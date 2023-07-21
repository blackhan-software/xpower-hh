/* eslint no-unused-expressions: [off] */
const { expect } = require("chai");
const { ethers } = require("hardhat");
const PRECISION = 1_000_000_000_000;
let UNIT; // decimals, decimals - 3

async function supplyOf(contract, delta = 0, log = undefined) {
  const HEXA = ethers.BigNumber.from(16);
  let others = ethers.BigNumber.from(0);
  let owners = ethers.BigNumber.from(0);
  for (let i = 0; i < 65 + delta; i++) {
    const nonce_hash = `0x${"0".repeat(i)}${"f".repeat(64 - i)}`;
    const amount = await contract.amountOf(i);
    expect(amount.gte(0)).to.be.true;
    const weight =
      i < 64 ? HEXA.pow(64 - i).sub(HEXA.pow(63 - i)) : HEXA.pow(64 - i);
    expect(weight.gt(0)).to.be.true;
    if (!amount.isZero()) {
      const delta_full = weight.mul(amount);
      expect(delta_full.gt(0)).to.be.true;
      const supply_gt = others.add(delta_full).gt(others);
      expect(supply_gt).to.be.true;
      others = others.add(delta_full);
    }
    const amount_extra = amount.div(2);
    if (!amount_extra.isZero()) {
      const delta_half = weight.mul(amount_extra);
      expect(delta_half.gt(0)).to.be.true;
      const owners_gt = owners.add(delta_half).gt(owners);
      expect(owners_gt).to.be.true;
      owners = owners.add(delta_half);
    }
    if (typeof log === "function") {
      if (log) log("H[", i, "] =", nonce_hash);
      if (!owners.isZero()) {
        const relative_inv = amount
          .add(amount_extra)
          .mul(PRECISION)
          .div(amount_extra);
        const relative_pct = (100 * PRECISION) / relative_inv.toNumber();
        if (log)
          log(
            `#[${i}] = ${amount.toString()} & ${amount_extra.toString()} =>`,
            relative_pct,
            "%"
          );
      } else {
        if (log)
          log(
            `#[${i}] = ${amount.toString()} & ${amount_extra.toString()} =>`,
            0,
            "%"
          );
      }
      if (log) log("W[", i, "] =", weight.toString());
      if (log) log("∑[", i, "] =", others.toString());
      if (log) log("Ω[", i, "] =", owners.toString());
      if (!owners.isZero()) {
        const supply_inv = others.add(owners).mul(PRECISION).div(owners);
        const supply_pct = (100 * PRECISION) / supply_inv.toNumber();
        if (log) log("S[", i, "] =", supply_pct, "%");
      } else {
        if (log) log("S[", i, "] =", 0, "%");
      }
      if (log) log("");
    }
  }
  const total = others.add(owners);
  return { total, others, owners };
}

let XPower, xpower; // contract & instance
let supply; // { total, other's, fund's }

const DEADLINE = 1_814_400; // [seconds] i.e. 3 weeks

describe("XPOW Supply", async () => {
  before(async () => {
    XPower = await ethers.getContractFactory("XPowerTest");
    xpower = await XPower.deploy([], DEADLINE);
    await xpower.deployed();
    await xpower.renounceOwnership();
  });
  beforeEach(async function () {
    const decimals = await xpower.decimals();
    expect(decimals).to.greaterThan(0);
    UNIT = 10n ** BigInt(decimals);
    expect(UNIT >= 1n).to.be.true;
  });
  before(async () => {
    supply = await supplyOf(xpower);
  });
  describe("calculation", async () => {
    it("should count maximum supply as 1.240629527542673e+76 tokens", async () => {
      expect(supply.total).to.eq(
        12406295275426735223954034108073704412850355499890060432797050421125652152320n *
          UNIT
      );
    });
    it("should count other's supply as 8.270863516951157e+75 tokens", async () => {
      expect(supply.others).to.eq(
        8270863516951156815969356072049136275233570333260040288531366947417101434880n *
          UNIT
      );
    });
    it("should count owner's supply as 4.135431758475579e+75 tokens", async () => {
      expect(supply.owners).to.eq(
        4135431758475578407984678036024568137616785166630020144265683473708550717440n *
          UNIT
      );
    });
    it("should count fund's supply share as 33.33%", async () => {
      expect(supply.total.div(3)).to.eq(supply.owners);
    });
  });
});
