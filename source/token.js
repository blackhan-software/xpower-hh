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
    case "XPOW.OLD":
      return (hash) => 2 ** zeros(hash) - 1;
    case "XPOW.CPU":
      return (hash) => zeros(hash);
    case "XPOW.GPU":
      return (hash) => 2 ** zeros(hash) - 1;
    case "XPOW.ASIC":
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
    case "XPOW.CPU": {
      const address = process.env.XPOWER_ADDRESS_CPU_V3;
      assert(address, "missing XPOWER_ADDRESS_CPU_V3");
      return await hre.ethers.getContractAt("XPowerCpu", address);
    }
    case "XPOW.GPU": {
      const address = process.env.XPOWER_ADDRESS_GPU_V3;
      assert(address, "missing XPOWER_ADDRESS_GPU_V3");
      return await hre.ethers.getContractAt("XPowerGpu", address);
    }
    case "XPOW.ASIC": {
      const address = process.env.XPOWER_ADDRESS_ASC_V3;
      assert(address, "missing XPOWER_ADDRESS_ASC_V3");
      return await hre.ethers.getContractAt("XPowerAsic", address);
    }
    default:
      throw new Error(`unknown ${symbol}`);
  }
};
const normalized = (symbol) => {
  switch (symbol.toUpperCase()) {
    case "CPU":
    case "XPOW.CPU":
    case "XPOW-CPU":
    case "XPOW_CPU":
      return "XPOW.CPU";
    case "GPU":
    case "XPOW.GPU":
    case "XPOW-GPU":
    case "XPOW_GPU":
      return "XPOW.GPU";
    case "ASIC":
    case "XPOW.ASIC":
    case "XPOW-ASIC":
    case "XPOW_ASIC":
      return "XPOW.ASIC";
    default:
      throw new Error(`unknown ${symbol}`);
  }
};
const threshold_of = (symbol) => {
  switch (symbol) {
    case "XPOW.CPU":
      return (level) => level;
    case "XPOW.GPU":
      return (level) => 2 ** level - 1;
    case "XPOW.ASIC":
      return (level) => 16 ** level - 1;
    default:
      throw new Error(`unknown ${symbol}`);
  }
};
exports.Token = Token;
