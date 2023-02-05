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
      const { address, env_name } = moe_latest(symbol);
      assert(address, `missing ${env_name}`);
      return await hre.ethers.getContractAt("XPowerThor", address);
    }
    case "LOKI": {
      const { address, env_name } = moe_latest(symbol);
      assert(address, `missing ${env_name}`);
      return await hre.ethers.getContractAt("XPowerLoki", address);
    }
    case "ODIN": {
      const { address, env_name } = moe_latest(symbol);
      assert(address, `missing ${env_name}`);
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
function moe_latest(symbol) {
  const names = Object.keys(process.env)
    .filter((name) => name.startsWith(`${symbol}_MOE`))
    .sort();
  if (names.length) {
    const name = names[names.length - 1];
    return {
      address: process.env[name],
      env_name: name,
    };
  }
  return {
    address: undefined,
    env_name: `${symbol}_MOE_V??`,
  };
}
exports.Token = Token;
