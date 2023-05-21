/* eslint no-unused-expressions: [off] */
/* eslint no-unused-vars: [off] */
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

let Array; // contracts
let array; // instances

describe("Array", async function () {
  before(async function () {
    await network.provider.send("hardhat_reset");
  });
  before(async function () {
    Array = await ethers.getContractFactory("ArrayTest");
    expect(Array).to.exist;
  });
  before(async function () {
    array = await Array.deploy();
    expect(array).to.exist;
  });
  describe("sorted", async function () {
    it("should return true for []", async function (a = []) {
      expect(await array.sorted(a)).to.be.true;
    });
    it("should return true for [0]", async function (a = [0]) {
      expect(await array.sorted(a)).to.be.true;
    });
    it("should return true for [0,1]", async function (a = [0, 1]) {
      expect(await array.sorted(a)).to.be.true;
    });
    it("should return false for [1,0]", async function (a = [1, 0]) {
      expect(await array.sorted(a)).to.be.false;
    });
    it("should return true for [0,1,2]", async function (a = [0, 1, 2]) {
      expect(await array.sorted(a)).to.be.true;
    });
    it("should return false for [2,0,1]", async function (a = [2, 0, 1]) {
      expect(await array.sorted(a)).to.be.false;
    });
    it("should return false for [1,2,0]", async function (a = [1, 2, 0]) {
      expect(await array.sorted(a)).to.be.false;
    });
  });
  describe("unique", async function () {
    it("should return true for []", async function (a = []) {
      expect(await array.unique(a)).to.be.true;
    });
    it("should return true for [0]", async function (a = [0]) {
      expect(await array.unique(a)).to.be.true;
    });
    it("should return true for [0,1]", async function (a = [0, 1]) {
      expect(await array.unique(a)).to.be.true;
    });
    it("should return false for [1,0]", async function (a = [1, 0]) {
      expect(await array.unique(a)).to.be.false;
    });
    it("should return true for [0,1,2]", async function (a = [0, 1, 2]) {
      expect(await array.unique(a)).to.be.true;
    });
    it("should return false for [2,0,1]", async function (a = [2, 0, 1]) {
      expect(await array.unique(a)).to.be.false;
    });
    it("should return false for [1,2,0]", async function (a = [1, 2, 0]) {
      expect(await array.unique(a)).to.be.false;
    });
  });
  describe("unique", async function () {
    it("should return false for [0,1,1]", async function (a = [0, 1, 1]) {
      expect(await array.unique(a)).to.be.false;
    });
    it("should return false for [0,0,1]", async function (a = [0, 0, 1]) {
      expect(await array.unique(a)).to.be.false;
    });
    it("should return false for [1,0,0]", async function (a = [1, 0, 0]) {
      expect(await array.unique(a)).to.be.false;
    });
    it("should return false for [1,1,0]", async function (a = [1, 1, 0]) {
      expect(await array.unique(a)).to.be.false;
    });
  });
});
