const { ethers } = require("hardhat");
const { expect } = require("chai");

let accounts; // all accounts
let addresses; // all addresses
let Moe, Nft; // contract
let moe, nft; // instance

const NFT_XPOW_URL = "https://xpowermine.com/nfts/xpow/{id}.json";
const SOME_ADDRESS = /^0x[0-fa-f]{40}$/i;

describe("XPowerNft", async function () {
  before(async function () {
    accounts = await ethers.getSigners();
    expect(accounts.length).to.be.greaterThan(0);
    addresses = accounts.map((acc) => acc.address);
    expect(addresses.length).to.be.greaterThan(1);
  });
  before(async function () {
    Nft = await ethers.getContractFactory("XPowerNft");
    expect(Nft).to.be.an("object");
    Moe = await ethers.getContractFactory("XPower");
    expect(Moe).to.be.an("object");
  });
  beforeEach(async function () {
    moe = await Moe.deploy([], 0);
    expect(moe).to.be.an("object");
    await moe.grantRole(moe.TRANSFER_ROLE(), addresses[0]);
    await moe.transferOwnership(addresses[1]);
    await moe.init();
  });
  beforeEach(async function () {
    nft = await Nft.deploy(moe.target, NFT_XPOW_URL, [], 0);
    expect(nft).to.be.an("object");
  });
  after(async function () {
    const [owner, signer_1] = await ethers.getSigners();
    await moe.grantRole(moe.TRANSFER_ROLE(), addresses[1]);
    await moe.connect(signer_1).transferOwnership(owner.address);
  });
  describe("royaltyInfo", function () {
    const level = (l) => {
      return l.toString().padStart(2, "0");
    };
    const amount = () => {
      return 50; // 0.5%
    };
    for (const l of [0, 3, 6, 9, 12, 15, 18, 21, 24]) {
      it(`should get info for 2023${level(l)} of ${amount()}`, async () => {
        const [b, a] = await nft.royaltyInfo(202300 + l, 10_000);
        expect(b).to.match(SOME_ADDRESS);
        expect(a).to.equal(amount(l));
      });
      it(`should get info for 2022${level(l)} of ${amount()}`, async () => {
        const [b, a] = await nft.royaltyInfo(202200 + l, 10_000);
        expect(b).to.match(SOME_ADDRESS);
        expect(a).to.equal(amount(l));
      });
      it(`should get info for 2021${level(l)} of ${amount()}`, async () => {
        const [b, a] = await nft.royaltyInfo(202100 + l, 10_000);
        expect(b).to.match(SOME_ADDRESS);
        expect(a).to.equal(amount(l));
      });
    }
  });
  describe("setRoyal", function () {
    it("should set new default royalty beneficiary", async function () {
      await nft.grantRole(nft.NFT_ROYAL_ROLE(), addresses[0]);
      await nft.setRoyal(addresses[1]);
      const royal = await nft.getRoyal();
      expect(royal).to.eq(addresses[1]);
    });
    it("should *not* set new default royalty beneficiary (missing role)", async function () {
      await nft.revokeRole(nft.NFT_ROYAL_ROLE(), addresses[0]);
      await nft.transferOwnership(addresses[1]);
      expect(
        await nft.setRoyal(addresses[1]).catch((ex) => {
          const m = ex.message.match(/account 0x[0-9a-f]+ is missing role/);
          if (m === null) console.debug(ex);
          expect(m).to.not.eq(null);
        }),
      ).to.eq(undefined);
    });
  });
});
