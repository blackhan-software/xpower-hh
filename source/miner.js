const { defaultAbiCoder: abi } = require("ethers/lib/utils");
const { InitializeKeccak } = require("keccak-wasm");
const { keccak256 } = require("keccak-wasm");
const { block } = require("./block");

class Miner {
  static async expired(timestamp) {
    const { timestamp: now } = await block();
    return this.interval(now) > this.interval(timestamp);
  }

  static interval(timestamp, ms = 3_600_000) {
    if (timestamp === undefined) {
      return Math.floor(new Date().getTime() / ms);
    }
    return Math.floor(parseInt(timestamp) / ms);
  }

  constructor() {
    // cache: (interval: number) => abi.encode(token, ...)
    this.abi_encoded = {};
    // cache: (level: number) => arrayify(nonce)
    this.array_cache = {};
    // cache: (level: number) => nonce
    this.nonce_cache = {};
  }

  async init(level) {
    await InitializeKeccak();
    const abi_encode = this.abi_encoder(level);
    return (token, address, interval, block_hash, nonce) => {
      const data = abi_encode(token, address, interval, block_hash, nonce);
      return "0x" + keccak256(data);
    };
  }

  abi_encoder(level) {
    const lazy_arrayify = this.arrayifier(level);
    return (token, address, interval, block_hash, nonce) => {
      let value = this.abi_encoded[interval];
      if (value === undefined) {
        const template = abi.encode(
          ["string", "address", "uint256", "bytes32", "uint256"],
          [token, address, interval, block_hash, 0]
        );
        this.abi_encoded[interval] = value = this.arrayify(template.slice(2));
        this.array_cache[level] = this.arrayify(nonce.toString(16));
        this.nonce_cache[level] = nonce;
      }
      const array = lazy_arrayify(nonce, nonce.toString(16));
      value.set(array, 128);
      return value;
    };
  }

  arrayifier(level) {
    const diff_max = 16n ** BigInt(level) - 1n;
    const offset_2 = 64 - level * 2;
    const offset_1 = 32 - level;
    return (nonce, hex_nonce) => {
      if (nonce - this.nonce_cache[level] > diff_max) {
        this.array_cache[level] = this.arrayify(hex_nonce);
        this.nonce_cache[level] = nonce;
      }
      const nonce_rhs = hex_nonce.slice(offset_2);
      const array_rhs = this.arrayify(nonce_rhs);
      this.array_cache[level].set(array_rhs, offset_1);
      return this.array_cache[level];
    };
  }

  arrayify(data, list = []) {
    for (let i = 0; i < data.length; i += 2) {
      list.push(parseInt(data.substring(i, i + 2), 16));
    }
    return new Uint8Array(list);
  }
}
module.exports = {
  Miner,
};
