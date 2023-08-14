const { NonceManager } = require("ethers");
const assert = require("assert");

class Token {
  static async contract(symbol, address) {
    if (typeof address === "string") {
      const signers = await hre.ethers.getSigners();
      assert(signers.length, "missing signers");
      const [signer] = signers.filter((s) =>
        s.address.match(new RegExp(address, "i")),
      );
      assert(signer, "missing signer for address");
      const manager = new NonceManager(signer);
      assert(manager, "missing nonce-manager");
      const instance = await contract(symbol);
      assert(instance, "missing contract instance");
      const connection = instance.connect(manager);
      assert(connection, "missing connection");
      return connection;
    } else {
      const instance = await contract(symbol);
      assert(instance, "missing contract instance");
      return instance;
    }
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
    case "XPOW":
      return (hash) => 2 ** zeros(hash) - 1;
    default:
      throw new Error(`unknown ${symbol}`);
  }
};
const zeros = (hash, counter = 0) => {
  while (hash[counter] === 0) {
    counter++;
  }
  if (hash[counter] < 16) {
    return 2 * counter + 1;
  } else {
    return 2 * counter;
  }
};
const contract = async (symbol) => {
  switch (symbol) {
    case "XPOW": {
      const { address, env_name } = moe_latest(symbol);
      assert(address, `missing ${env_name}`);
      return await hre.ethers.getContractAt("XPower", address);
    }
    default:
      throw new Error(`unknown ${symbol}`);
  }
};
const normalized = (symbol) => {
  switch (symbol.toUpperCase()) {
    case "XPOW":
      return "XPOW";
    default:
      throw new Error(`unknown ${symbol}`);
  }
};
const threshold_of = (symbol) => {
  switch (symbol) {
    case "XPOW":
      return (level) => 2 ** level - 1;
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
const format = (n, base = 10n ** 18n) => {
  return (Number(n) / Number(base)).toFixed(3).padStart(9, " ");
};
module.exports = { Token, format };
