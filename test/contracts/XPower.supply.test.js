/* eslint no-unused-expressions: [off] */
const { expect } = require("chai");
const { ethers } = require("hardhat");
const PRECISION = 1_000_000_000_000;

async function supplyOf(contract, delta = 0, log = console.log) {
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
      log("H[", i, "] =", nonce_hash);
      if (!owners.isZero()) {
        const relative_inv = amount
          .add(amount_extra)
          .mul(PRECISION)
          .div(amount_extra);
        const relative_pct = (100 * PRECISION) / relative_inv.toNumber();
        log(
          `#[${i}] = ${amount.toString()} & ${amount_extra.toString()} =>`,
          relative_pct,
          "%"
        );
      } else {
        log(
          `#[${i}] = ${amount.toString()} & ${amount_extra.toString()} =>`,
          0,
          "%"
        );
      }
      log("W[", i, "] =", weight.toString());
      log("∑[", i, "] =", others.toString());
      log("Ω[", i, "] =", owners.toString());
      if (!owners.isZero()) {
        const supply_inv = others.add(owners).mul(PRECISION).div(owners);
        const supply_pct = (100 * PRECISION) / supply_inv.toNumber();
        log("S[", i, "] =", supply_pct, "%");
      } else {
        log("S[", i, "] =", 0, "%");
      }
      log("");
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
  before(async () => {
    supply = await supplyOf(xpower);
  });
  describe("calculation", async () => {
    it("should count maximum supply as 817.356B × 10^64 tokens", async () => {
      expect(supply.total).to.eq(
        "8173559240281143206369716588848558201407293035221686873373476518205632680466"
      );
    });
    it("should count other's supply as 771.947B × 10^64 tokens", async () => {
      expect(supply.others).to.eq(
        "7719472615821079694904732333912527190217998977709370935963838933860875309329"
      );
    });
    it("should count owner's supply as 004.541B × 10^64 tokens", async () => {
      expect(supply.owners).to.eq(
        "454086624460063511464984254936031011189294057512315937409637584344757371137"
      );
    });
    it("should count fund's supply share as 5.88%", async () => {
      expect(supply.total.div(supply.owners)).to.eq(
        "18" // i.e. 1/18 = 5.56% of total supply for project fund
      );
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
  before(async () => {
    supply = await supplyOf(xpower);
  });
  describe("calculation", async () => {
    it("should count maximum supply as 878.779B × 10^64 tokens", async () => {
      expect(supply.total).to.eq(
        "8787792486760604116967440826552207292435668479088792806564000920878366851072"
      );
    });
    it("should count other's supply as 827.086B × 10^64 tokens", async () => {
      expect(supply.others).to.eq(
        "8270863516951156815969356072049136275233570333260040288531366947417101434880"
      );
    });
    it("should count owner's supply as 005.169B × 10^64 tokens", async () => {
      expect(supply.owners).to.eq(
        "516928969809447300998084754503071017202098145828752518032633973461265416192"
      );
    });
    it("should count fund's supply share as 5.88%", async () => {
      expect(supply.total.div(supply.owners)).to.eq(
        "17" // i.e. 1/17 = 5.88% of total supply for project fund
      );
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
  before(async () => {
    supply = await supplyOf(xpower, -1);
  });
  describe("calculation", async () => {
    it("should count maximum supply as 1'024.398T × 10^64 tokens", async () => {
      expect(supply.total).to.eq(
        "10243981394713817163879045579987358347893978955888388649865763135200064687833090"
      );
    });
    it("should count other's supply as 683.173T × 10^64 tokens", async () => {
      expect(supply.others).to.eq(
        "6831733265001655529990688115512586563342929095272793278327997456466874648756225"
      );
    });
    it("should count owner's supply as 341.225T × 10^64 tokens", async () => {
      expect(supply.owners).to.eq(
        "3412248129712161633888357464474771784551049860615595371537765678733190039076865"
      );
    });
    it("should count fund's supply share as 33.33%", async () => {
      expect(supply.total.div(supply.owners)).to.eq(
        "3" // i.e. 1/3 = 33.33% of total supply for project fund
      );
    });
  });
});
