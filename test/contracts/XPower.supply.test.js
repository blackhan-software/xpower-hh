/* eslint no-unused-expressions: [off] */
const { expect } = require("chai");
const { ethers } = require("hardhat");
const PRECISION = 1_000_000_000_000;
let UNUM; // decimals, decimals - 3

async function supplyOf(contract, delta = 0, log = undefined) {
  const HEXA = ethers.BigNumber.from(16);
  let others = ethers.BigNumber.from(0);
  let owners = ethers.BigNumber.from(0);
  for (let i = 0; i < 65 + delta; i++) {
    const nonce_hash = `0x${"0".repeat(i)}${"f".repeat(64 - i)}`;
    const amount = await contract.amountOf(nonce_hash);
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

const NONE_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEADLINE = 1_814_400; // [seconds] i.e. 3 weeks

describe("THOR Supply", async () => {
  before(async () => {
    XPower = await ethers.getContractFactory("XPowerThorTest");
    xpower = await XPower.deploy(NONE_ADDRESS, DEADLINE);
    await xpower.deployed();
    await xpower.renounceOwnership();
  });
  beforeEach(async function () {
    const decimals = await xpower.decimals();
    expect(decimals).to.greaterThan(0);
    UNUM = 10n ** BigInt(decimals);
    expect(UNUM >= 1n).to.be.true;
  });
  before(async () => {
    supply = await supplyOf(xpower);
  });
  describe("calculation", async () => {
    it("should count maximum supply as 1.157920892373162e+76 tokens", async () => {
      expect(supply.total).to.eq(
        11579208923731619542357098500868790785326998466564056403945758400791312963993n *
          UNUM +
          UNUM / 2n
      );
    });
    it("should count other's supply as 7.719472615821079e+75 tokens", async () => {
      expect(supply.others).to.eq(
        7719472615821079694904732333912527190217998977709370935963838933860875309329n *
          UNUM
      );
    });
    it("should count owner's supply as 3.859736307910540e+75 tokens", async () => {
      expect(supply.owners).to.eq(
        3859736307910539847452366166956263595108999488854685467981919466930437654664n *
          UNUM +
          UNUM / 2n
      );
    });
    it("should count fund's supply share as 33.33%", async () => {
      expect(supply.total.div(3)).to.eq(supply.owners);
    });
  });
});
describe("LOKI Supply", async () => {
  before(async () => {
    XPower = await ethers.getContractFactory("XPowerLokiTest");
    xpower = await XPower.deploy(NONE_ADDRESS, DEADLINE);
    await xpower.deployed();
    await xpower.renounceOwnership();
  });
  beforeEach(async function () {
    const decimals = await xpower.decimals();
    expect(decimals).to.greaterThan(0);
    UNUM = 10n ** BigInt(decimals);
    expect(UNUM >= 1n).to.be.true;
  });
  before(async () => {
    supply = await supplyOf(xpower);
  });
  describe("calculation", async () => {
    it("should count maximum supply as 1.240629527542673e+76 tokens", async () => {
      expect(supply.total).to.eq(
        12406295275426735223954034108073704412850355499890060432797050421125652152320n *
          UNUM
      );
    });
    it("should count other's supply as 8.270863516951157e+75 tokens", async () => {
      expect(supply.others).to.eq(
        8270863516951156815969356072049136275233570333260040288531366947417101434880n *
          UNUM
      );
    });
    it("should count owner's supply as 4.135431758475579e+75 tokens", async () => {
      expect(supply.owners).to.eq(
        4135431758475578407984678036024568137616785166630020144265683473708550717440n *
          UNUM
      );
    });
    it("should count fund's supply share as 33.33%", async () => {
      expect(supply.total.div(3)).to.eq(supply.owners);
    });
  });
});
describe("ODIN Supply", async () => {
  before(async () => {
    XPower = await ethers.getContractFactory("XPowerOdinTest");
    xpower = await XPower.deploy(NONE_ADDRESS, DEADLINE);
    await xpower.deployed();
    await xpower.renounceOwnership();
  });
  beforeEach(async function () {
    const decimals = await xpower.decimals();
    expect(decimals).to.greaterThan(0);
    UNUM = 10n ** BigInt(decimals);
    expect(UNUM >= 1n).to.be.true;
  });
  before(async () => {
    supply = await supplyOf(xpower, -15);
  });
  describe("calculation", async () => {
    it("should count maximum supply as 7.967943140642821e+78 tokens", async () => {
      expect(supply.total).to.eq(
        7967943140642820697584478405910336659153140819804391312965175107630913290240000n *
          UNUM
      );
    });
    it("should count other's supply as 5.311962093761881e+78 tokens", async () => {
      expect(supply.others).to.eq(
        5311962093761880465056318937273557772768760546536260875310116738420608860160000n *
          UNUM
      );
    });
    it("should count owner's supply as 2.655981046880940e+78 tokens", async () => {
      expect(supply.owners).to.eq(
        2655981046880940232528159468636778886384380273268130437655058369210304430080000n *
          UNUM
      );
    });
    it("should count fund's supply share as 33.33%", async () => {
      expect(supply.total.div(3)).to.eq(supply.owners);
    });
  });
});
