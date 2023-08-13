const { ethers } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contract
let xpower; // instance

const DEADLINE = 126_230_400; // [seconds] i.e. 4 years

describe("XPower", async function () {
  before(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
    addresses = accounts.map((acc) => acc.address);
    expect(addresses.length).to.be.greaterThan(0);
  });
  before(async function () {
    XPower = await ethers.getContractFactory("XPowerTest");
  });
  beforeEach(async function () {
    xpower = await XPower.deploy([], DEADLINE);
    await xpower.init();
  });
  describe("parametrization of share", async function () {
    it("should get array", async function () {
      const share = await xpower.getShare();
      expect(share).to.deep.eq([0, 2, 1, 256]);
    });
    it("should set array", async function () {
      await xpower.grantRole(xpower.SHARE_ROLE(), addresses[0]);
      await xpower.setShare([0, 1, 1, 256]);
      const share = await xpower.getShare();
      expect(share).to.deep.eq([0, 1, 1, 256]);
    });
    it("should *not* set array (invalid array.length)", async function () {
      await xpower.grantRole(xpower.SHARE_ROLE(), addresses[0]);
      const tx = await xpower.setShare([1, 2, 3]).catch((ex) => {
        const m = ex.message.match(/invalid array.length/);
        if (m === null) console.debug(ex);
        expect(m).to.not.eq(null);
      });
      expect(tx).to.eq(undefined);
      const share = await xpower.getShare();
      expect(share).to.deep.eq([0, 2, 1, 256]);
    });
    it("should *not* set array (invalid array[1] == 0)", async function () {
      await xpower.grantRole(xpower.SHARE_ROLE(), addresses[0]);
      const tx = await xpower.setShare([0, 0, 0, 256]).catch((ex) => {
        const m = ex.message.match(/invalid array\[1\] == 0/);
        if (m === null) console.debug(ex);
        expect(m).to.not.eq(null);
      });
      expect(tx).to.eq(undefined);
      const share = await xpower.getShare();
      expect(share).to.deep.eq([0, 2, 1, 256]);
    });
    it("should *not* set array (invalid array[2] == 0)", async function () {
      await xpower.grantRole(xpower.SHARE_ROLE(), addresses[0]);
      const tx = await xpower.setShare([0, 1, 0, 256]).catch((ex) => {
        const m = ex.message.match(/invalid array\[2\] == 0/);
        if (m === null) console.debug(ex);
        expect(m).to.not.eq(null);
      });
      expect(tx).to.eq(undefined);
      const share = await xpower.getShare();
      expect(share).to.deep.eq([0, 2, 1, 256]);
    });
    it("should *not* set array (missing role)", async function () {
      const [_owner, signer_1] = await ethers.getSigners();
      const tx = await xpower
        .connect(signer_1)
        .setShare([0, 1, 1, 256])
        .catch((ex) => {
          const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        });
      expect(tx).to.eq(undefined);
      const share = await xpower.getShare();
      expect(share).to.deep.eq([0, 2, 1, 256]);
    });
  });
});
