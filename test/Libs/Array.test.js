const { ethers } = require("hardhat");
const { expect } = require("chai");

let array; // instance

describe("Array", async function () {
  before(async function () {
    array = await ethers.deployContract("ArrayTest");
    expect(array).to.be.an("object");
  });
  describe("sorted", async function () {
    it("should return true for []", async function (a = []) {
      expect(await array.sorted(a)).to.eq(true);
    });
    it("should return true for [0]", async function (a = [0]) {
      expect(await array.sorted(a)).to.eq(true);
    });
    it("should return true for [0,1]", async function (a = [0, 1]) {
      expect(await array.sorted(a)).to.eq(true);
    });
    it("should return false for [1,0]", async function (a = [1, 0]) {
      expect(await array.sorted(a)).to.eq(false);
    });
    it("should return true for [0,1,2]", async function (a = [0, 1, 2]) {
      expect(await array.sorted(a)).to.eq(true);
    });
    it("should return false for [2,0,1]", async function (a = [2, 0, 1]) {
      expect(await array.sorted(a)).to.eq(false);
    });
    it("should return false for [1,2,0]", async function (a = [1, 2, 0]) {
      expect(await array.sorted(a)).to.eq(false);
    });
  });
  describe("unique", async function () {
    it("should return true for []", async function (a = []) {
      expect(await array.unique(a)).to.eq(true);
    });
    it("should return true for [0]", async function (a = [0]) {
      expect(await array.unique(a)).to.eq(true);
    });
    it("should return true for [0,1]", async function (a = [0, 1]) {
      expect(await array.unique(a)).to.eq(true);
    });
    it("should return false for [1,0]", async function (a = [1, 0]) {
      expect(await array.unique(a)).to.eq(false);
    });
    it("should return true for [0,1,2]", async function (a = [0, 1, 2]) {
      expect(await array.unique(a)).to.eq(true);
    });
    it("should return false for [2,0,1]", async function (a = [2, 0, 1]) {
      expect(await array.unique(a)).to.eq(false);
    });
    it("should return false for [1,2,0]", async function (a = [1, 2, 0]) {
      expect(await array.unique(a)).to.eq(false);
    });
  });
  describe("unique", async function () {
    it("should return false for [0,1,1]", async function (a = [0, 1, 1]) {
      expect(await array.unique(a)).to.eq(false);
    });
    it("should return false for [0,0,1]", async function (a = [0, 0, 1]) {
      expect(await array.unique(a)).to.eq(false);
    });
    it("should return false for [1,0,0]", async function (a = [1, 0, 0]) {
      expect(await array.unique(a)).to.eq(false);
    });
    it("should return false for [1,1,0]", async function (a = [1, 1, 0]) {
      expect(await array.unique(a)).to.eq(false);
    });
  });
});
