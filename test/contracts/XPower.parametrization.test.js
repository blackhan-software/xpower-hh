/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower; // contract
let xpower; // instance

const DEADLINE = 126_230_400; // [seconds] i.e. 4 years

describe("XPower", async function () {
  before(async function () {
    await network.provider.send("hardhat_reset");
  });
  before(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
    addresses = accounts.map((acc) => acc.address);
    expect(addresses.length).to.be.greaterThan(0);
  });
  before(async function () {
    XPower = await ethers.getContractFactory("XPowerLokiTest");
  });
  beforeEach(async function () {
    xpower = await XPower.deploy([], DEADLINE);
    await xpower.deployed();
    await xpower.init();
  });
  describe("parametrization of share", async function () {
    it("should get array", async function () {
      const share = await xpower.getShare();
      Expect(share).to.equal([0, 0, 2, 1]);
    });
    it("should set array", async function () {
      await xpower.grantRole(xpower.SHARE_ROLE(), addresses[0]);
      await xpower.setShare([0, 0, 1, 1]);
      const share = await xpower.getShare();
      Expect(share).to.equal([0, 0, 1, 1]);
    });
    it("should *not* set array (invalid array.length)", async function () {
      await xpower.grantRole(xpower.SHARE_ROLE(), addresses[0]);
      const tx = await xpower.setShare([1, 3, 2]).catch((ex) => {
        const m = ex.message.match(/invalid array.length/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(tx).to.eq(undefined);
      const share = await xpower.getShare();
      Expect(share).to.equal([0, 0, 2, 1]);
    });
    it("should *not* set array (invalid array[2] == 0)", async function () {
      await xpower.grantRole(xpower.SHARE_ROLE(), addresses[0]);
      const tx = await xpower.setShare([0, 0, 0, 0]).catch((ex) => {
        const m = ex.message.match(/invalid array\[2\] == 0/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(tx).to.eq(undefined);
      const share = await xpower.getShare();
      Expect(share).to.equal([0, 0, 2, 1]);
    });
    it("should *not* set array (invalid array[3] == 0)", async function () {
      await xpower.grantRole(xpower.SHARE_ROLE(), addresses[0]);
      const tx = await xpower.setShare([0, 0, 1, 0]).catch((ex) => {
        const m = ex.message.match(/invalid array\[3\] == 0/);
        if (m === null) console.debug(ex);
        expect(m).to.be.not.null;
      });
      expect(tx).to.eq(undefined);
      const share = await xpower.getShare();
      Expect(share).to.equal([0, 0, 2, 1]);
    });
    it("should *not* set array (missing role)", async function () {
      const [owner, signer_1] = await ethers.getSigners();
      const tx = await xpower
        .connect(signer_1)
        .setShare([0, 0, 1, 1])
        .catch((ex) => {
          const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        });
      expect(tx).to.eq(undefined);
      const share = await xpower.getShare();
      Expect(share).to.equal([0, 0, 2, 1]);
    });
  });
});
function Expect(array) {
  return expect(array.map((bn) => bn.toNumber())).deep;
}
