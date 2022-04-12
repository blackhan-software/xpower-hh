const assert = require("assert");

class Token {
  static async contract(symbol, address) {
    const instance = await contract(symbol);
    assert(instance, "missing contract instance");
    if (typeof address === "string") {
      const signers = await hre.ethers.getSigners();
      assert(signers.length > 0, "missing signers");
      const signer = signers.filter((s) => s.address === address)[0];
      assert(signer, "missing signer for address");
      const connect = instance.connect(signer);
      assert(connect, "missing connection");
    }
    return instance;
  }

  static symbol(value) {
    return normalized(value);
  }

  constructor(symbol) {
    this.amount_of = amount_of(symbol);
    this.symbol = symbol;
  }

  threshold(level) {
    return threshold_of(this.symbol)(level);
  }
}
const amount_of = (symbol) => {
  switch (symbol) {
    case "PARA":
      return (hash) => zeros(hash);
    case "AQCH":
      return (hash) => 2 ** zeros(hash) - 1;
    case "QRSH":
      return (hash) => 16 ** zeros(hash) - 1;
    default:
      throw new Error(`unknown ${symbol}`);
  }
};
const zeros = (hash) => {
  let counter = 2;
  while (hash[counter] === "0") {
    counter++;
  }
  return counter - 2;
};
const contract = async (symbol) => {
  switch (symbol) {
    case "PARA": {
      const address = process.env.PARA_MOE_V4a;
      assert(address, "missing PARA_MOE_V4a");
      return await hre.ethers.getContractAt("XPowerPara", address);
    }
    case "AQCH": {
      const address = process.env.AQCH_MOE_V4a;
      assert(address, "missing AQCH_MOE_V4a");
      return await hre.ethers.getContractAt("XPowerAqch", address);
    }
    case "QRSH": {
      const address = process.env.QRSH_MOE_V4a;
      assert(address, "missing QRSH_MOE_V4a");
      return await hre.ethers.getContractAt("XPowerQrsh", address);
    }
    default:
      throw new Error(`unknown ${symbol}`);
  }
};
const normalized = (symbol) => {
  switch (symbol.toUpperCase()) {
    case "PARA":
      return "PARA";
    case "AQCH":
      return "AQCH";
    case "QRSH":
      return "QRSH";
    default:
      throw new Error(`unknown ${symbol}`);
  }
};
const threshold_of = (symbol) => {
  switch (symbol) {
    case "PARA":
      return (level) => level;
    case "AQCH":
      return (level) => 2 ** level - 1;
    case "QRSH":
      return (level) => 16 ** level - 1;
    default:
      throw new Error(`unknown ${symbol}`);
  }
};
exports.Token = Token;
