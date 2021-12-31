const assert = require("assert");

class Token {
  static async contract(symbol, address) {
    const instance = await contract(symbol);
    assert(instance, "missing contract instance");
    const signers = await hre.ethers.getSigners();
    assert(signers.length > 0, "missing signers");
    const signer = signers.filter((s) => s.address === address)[0];
    assert(signer, "missing signer for miner-address");
    const connect = instance.connect(signer);
    assert(connect, "missing connection");
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
    case "XPOW.OLD": {
      const address = process.env.XPOWER_ADDRESS_OLD;
      assert(address, "missing XPOWER_ADDRESS_OLD");
      return await hre.ethers.getContractAt("XPowerGpu", address);
    }
    case "XPOW.CPU": {
      const address = process.env.XPOWER_ADDRESS_CPU;
      assert(address, "missing XPOWER_ADDRESS_CPU");
      return await hre.ethers.getContractAt("XPowerCpu", address);
    }
    case "XPOW.GPU": {
      const address = process.env.XPOWER_ADDRESS_GPU;
      assert(address, "missing XPOWER_ADDRESS_GPU");
      return await hre.ethers.getContractAt("XPowerGpu", address);
    }
    case "XPOW.ASIC": {
      const address = process.env.XPOWER_ADDRESS_ASC;
      assert(address, "missing XPOWER_ADDRESS_ASC");
      return await hre.ethers.getContractAt("XPowerAsic", address);
    }
    default:
      throw new Error(`unknown ${symbol}`);
  }
};
const normalized = (symbol) => {
  switch (symbol.toUpperCase()) {
    case "OLD":
    case "XPOW.OLD":
    case "XPOW-OLD":
    case "XPOW_OLD":
      return "XPOW.OLD";
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
    case "XPOW.OLD":
      return (level) => 2 ** level - 1;
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
