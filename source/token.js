const assert = require("assert");

class Token {
  static async contract(symbol, address) {
    const instance = await contract(symbol);
    assert(instance, "missing contract instance");
    if (typeof address === "string") {
      const signers = await hre.ethers.getSigners();
      assert(signers.length > 0, "missing signers");
      const signer = signers.filter((s) =>
        s.address.match(new RegExp(address, "i"))
      )[0];
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
    case "THOR":
      return (hash) => zeros(hash);
    case "LOKI":
      return (hash) => 2 ** zeros(hash) - 1;
    case "ODIN":
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
    case "THOR": {
      const address = process.env.THOR_MOE_V4a;
      assert(address, "missing THOR_MOE_V4a");
      return await hre.ethers.getContractAt("XPowerThor", address);
    }
    case "LOKI": {
      const address = process.env.LOKI_MOE_V4a;
      assert(address, "missing LOKI_MOE_V4a");
      return await hre.ethers.getContractAt("XPowerLoki", address);
    }
    case "ODIN": {
      const address = process.env.ODIN_MOE_V4a;
      assert(address, "missing ODIN_MOE_V4a");
      return await hre.ethers.getContractAt("XPowerOdin", address);
    }
    default:
      throw new Error(`unknown ${symbol}`);
  }
};
const normalized = (symbol) => {
  switch (symbol.toUpperCase()) {
    case "THOR":
      return "THOR";
    case "LOKI":
      return "LOKI";
    case "ODIN":
      return "ODIN";
    default:
      throw new Error(`unknown ${symbol}`);
  }
};
const threshold_of = (symbol) => {
  switch (symbol) {
    case "THOR":
      return (level) => level;
    case "LOKI":
      return (level) => 2 ** level - 1;
    case "ODIN":
      return (level) => 16 ** level - 1;
    default:
      throw new Error(`unknown ${symbol}`);
  }
};
exports.Token = Token;
