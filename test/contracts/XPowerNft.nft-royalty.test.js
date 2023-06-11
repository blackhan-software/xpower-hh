/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let accounts; // all accounts
let addresses; // all addresses
let XPower, XPowerNft; // contracts
let xpower, nft; // instances

const NFT_LOKI_URL = "https://xpowermine.com/nfts/loki/{id}.json";
const SOME_ADDRESS = /^0x[0-fa-f]{40}$/i;
const DEADLINE = 0; // [seconds]

const DAYS = 24 * 3600; // [seconds]
const MONTH = (365_25 * DAYS) / 12_00;

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
    XPowerNft = await ethers.getContractFactory("XPowerNft");
    expect(XPowerNft).to.exist;
    XPower = await ethers.getContractFactory("XPowerLoki");
    expect(XPower).to.exist;
  });
  beforeEach(async function () {
    xpower = await XPower.deploy([], DEADLINE);
    expect(xpower).to.exist;
    await xpower.deployed();
    await xpower.transferOwnership(addresses[1]);
    await xpower.init();
  });
  beforeEach(async function () {
    nft = await XPowerNft.deploy(NFT_LOKI_URL, [xpower.address], [], DEADLINE);
    expect(nft).to.exist;
    await nft.deployed();
  });
  after(async function () {
    const [owner, signer_1] = await ethers.getSigners();
    await xpower.connect(signer_1).transferOwnership(owner.address);
  });
  describe("royaltyInfo", function () {
    const level = (l) => {
      return l.toString().padStart(2, "0");
    };
    const amount = (_) => {
      return 10; // ignore level argument!
    };
    for (const l of [0, 3, 6, 9, 12, 15, 18, 21, 24]) {
      it(`should get info for 12023${level(l)} of ${amount(l)}`, async () => {
        const [b, a] = await nft.royaltyInfo(1202300 + l, 10_000);
        expect(b).to.match(SOME_ADDRESS);
        expect(a).to.equal(amount(l));
      });
      it(`should get info for 12022${level(l)} of ${amount(l)}`, async () => {
        const [b, a] = await nft.royaltyInfo(2202200 + l, 10_000);
        expect(b).to.match(SOME_ADDRESS);
        expect(a).to.equal(amount(l));
      });
      it(`should get info for 12021${level(l)} of ${amount(l)}`, async () => {
        const [b, a] = await nft.royaltyInfo(3202100 + l, 10_000);
        expect(b).to.match(SOME_ADDRESS);
        expect(a).to.equal(amount(l));
      });
    }
  });
  describe("setRoyalty[Batch]", function () {
    it("should *not* set new royalty to 0.04% (too small)", async function () {
      await nft.grantRole(nft.NFT_ROYALTY_ROLE(), addresses[0]);
      expect(
        await nft.setRoyaltyBatch([1], [0, 3, 4]).catch((ex) => {
          const m = ex.message.match(/invalid change: too small/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      const array = (await nft.getRoyalty(1)).map((bn) => bn.toNumber());
      expect(array).to.deep.eq([0, 3, 10_000]);
    });
    it("should set new royalty to 0.05%", async function () {
      await nft.grantRole(nft.NFT_ROYALTY_ROLE(), addresses[0]);
      expect(await royalty(nft)).to.equal(10_000);
      await nft.setRoyaltyBatch([1], [0, 3, 10_000]);
      expect(await royalty(nft)).to.equal(10_000);
      await network.provider.send("evm_increaseTime", [MONTH]);
      await network.provider.send("evm_mine", []);
      expect(await royalty(nft)).to.equal(10_000);
      {
        await nft.setRoyaltyBatch([1], [0, 3, 5_000]);
        const array = (await nft.getRoyalty(1)).map((bn) => bn.toNumber());
        expect(array).to.deep.eq([0, 3, 5_000]);
      }
      expect(await royalty(nft)).to.equal(10_000);
      await network.provider.send("evm_increaseTime", [MONTH * 2 ** 0]);
      await network.provider.send("evm_mine", []);
      expect(await royalty(nft)).is.within(7_499, 7_501);
      await network.provider.send("evm_increaseTime", [MONTH * 2 ** 1]);
      await network.provider.send("evm_mine", []);
      expect(await royalty(nft)).is.within(6_249, 6_251);
      await network.provider.send("evm_increaseTime", [MONTH * 2 ** 2]);
      await network.provider.send("evm_mine", []);
      expect(await royalty(nft)).is.within(5_624, 5_626);
      await network.provider.send("evm_increaseTime", [MONTH * 2 ** 3]);
      await network.provider.send("evm_mine", []);
      expect(await royalty(nft)).is.within(5_311, 5_313);
      await network.provider.send("evm_increaseTime", [MONTH * 2 ** 4]);
      await network.provider.send("evm_mine", []);
      expect(await royalty(nft)).is.within(5_155, 5_157);
    });
    it("should *not* set new royalty to 0.10% (too frequent)", async function () {
      await nft.grantRole(nft.NFT_ROYALTY_ROLE(), addresses[0]);
      await nft.setRoyaltyBatch([1], [0, 3, 10_000]);
      expect(
        await nft.setRoyaltyBatch([1], [0, 3, 10_000]).catch((ex) => {
          const m = ex.message.match(/invalid change: too frequent/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      const array = (await nft.getRoyalty(1)).map((bn) => bn.toNumber());
      expect(array).to.deep.eq([0, 3, 10_000]);
    });
    it("should set new royalty to 0.20%", async function () {
      await nft.grantRole(nft.NFT_ROYALTY_ROLE(), addresses[0]);
      expect(await royalty(nft)).to.equal(10_000);
      await nft.setRoyaltyBatch([1], [0, 3, 10_000]);
      expect(await royalty(nft)).to.equal(10_000);
      await network.provider.send("evm_increaseTime", [MONTH]);
      await network.provider.send("evm_mine", []);
      expect(await royalty(nft)).to.equal(10_000);
      {
        await nft.setRoyaltyBatch([1], [0, 3, 20_000]);
        const array = (await nft.getRoyalty(1)).map((bn) => bn.toNumber());
        expect(array).to.deep.eq([0, 3, 20_000]);
      }
      expect(await royalty(nft)).to.equal(10_000);
      await network.provider.send("evm_increaseTime", [MONTH * 2 ** 0]);
      await network.provider.send("evm_mine", []);
      expect(await royalty(nft)).is.within(14_999, 15_001);
      await network.provider.send("evm_increaseTime", [MONTH * 2 ** 1]);
      await network.provider.send("evm_mine", []);
      expect(await royalty(nft)).is.within(17_499, 17_501);
      await network.provider.send("evm_increaseTime", [MONTH * 2 ** 2]);
      await network.provider.send("evm_mine", []);
      expect(await royalty(nft)).is.within(18_749, 18_751);
      await network.provider.send("evm_increaseTime", [MONTH * 2 ** 3]);
      await network.provider.send("evm_mine", []);
      expect(await royalty(nft)).is.within(19_374, 19_375);
      await network.provider.send("evm_increaseTime", [MONTH * 2 ** 4]);
      await network.provider.send("evm_mine", []);
      expect(await royalty(nft)).is.within(19_686, 19_688);
    });
    it("should *not* set new royalty to 0.21% (too large)", async function () {
      await nft.grantRole(nft.NFT_ROYALTY_ROLE(), addresses[0]);
      expect(
        await nft.setRoyaltyBatch([1], [0, 3, 21_000]).catch((ex) => {
          const m = ex.message.match(/invalid change: too large/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
      const array = (await nft.getRoyalty(1)).map((bn) => bn.toNumber());
      expect(array).to.deep.eq([0, 3, 10_000]);
    });
    it("should *not* set new royalty (missing role)", async function () {
      await nft.revokeRole(nft.NFT_ROYALTY_ROLE(), addresses[0]);
      await nft.transferOwnership(addresses[1]);
      expect(
        await nft.setRoyaltyBatch([1], [0, 20, 3]).catch((ex) => {
          const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("setRoyal", function () {
    it("should set new default royalty beneficiary", async function () {
      await nft.grantRole(nft.NFT_ROYAL_ROLE(), addresses[0]);
      await nft.setRoyal(1, addresses[1]);
      const royal = await nft.getRoyal(1);
      expect(royal).to.eq(addresses[1]);
    });
    it("should *not* set new default royalty beneficiary (missing role)", async function () {
      await nft.revokeRole(nft.NFT_ROYAL_ROLE(), addresses[0]);
      await nft.transferOwnership(addresses[1]);
      expect(
        await nft.setRoyal(1, addresses[1]).catch((ex) => {
          const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
  describe("setRoyalBatch", function () {
    it("should set new default royalty beneficiaries", async function () {
      await nft.grantRole(nft.NFT_ROYAL_ROLE(), addresses[0]);
      await nft.setRoyalBatch([1, 2, 3], addresses[1]);
      const royal_1 = await nft.getRoyal(1);
      expect(royal_1).to.eq(addresses[1]);
      const royal_2 = await nft.getRoyal(2);
      expect(royal_2).to.eq(addresses[1]);
      const royal_3 = await nft.getRoyal(3);
      expect(royal_3).to.eq(addresses[1]);
    });
    it("should *not* set new default royalty beneficiary (missing role)", async function () {
      await nft.revokeRole(nft.NFT_ROYAL_ROLE(), addresses[0]);
      await nft.transferOwnership(addresses[1]);
      expect(
        await nft.setRoyalBatch([1], addresses[1]).catch((ex) => {
          const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
          if (m === null) console.debug(ex);
          expect(m).to.be.not.null;
        })
      ).to.eq(undefined);
    });
  });
});
async function royalty(
  nft,
  { id, price } = { id: 1202203, price: 10_000_000 }
) {
  const info = await nft.royaltyInfo(id, price);
  expect(info[1].toNumber()).to.be.greaterThan(0);
  expect(info[0]).to.match(SOME_ADDRESS);
  return info[1];
}
