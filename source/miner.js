const { solidityPack } = require("ethers/lib/utils");
const { createSHA256 } = require("hash-wasm");
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
    this.abi_encoded = {}; // cache: block-hash => abi.encode(...)
  }

  async init(nonce_length) {
    const hasher = await createSHA256();
    const abi_encode = this.abi_encoder(nonce_length);
    return (contract, address, block_hash, nonce) => {
      const data1 = abi_encode(contract, address, block_hash, nonce);
      const data2 = hasher.init().update(data1).digest("binary");
      return "0x" + hasher.init().update(data2).digest("hex");
    };
  }

  abi_encoder(nonce_length) {
    return (contract, address, block_hash, nonce) => {
      let value = this.abi_encoded[block_hash];
      if (value === undefined) {
        const template = solidityPack(
          ["uint160", "bytes16", "bytes"],
          [
            BigInt(contract) ^ BigInt(address),
            block_hash,
            new Uint8Array(nonce_length),
          ]
        );
        value = arrayify(template.slice(2));
        this.abi_encoded[block_hash] = value;
      }
      const array = arrayify(nonce.toString(16));
      value.set(array, 36);
      return value;
    };
  }
}
function arrayify(data, list = []) {
  for (let i = 0; i < data.length; i += 2) {
    list.push(parseInt(data.substring(i, i + 2), 16));
  }
  return new Uint8Array(list);
}
module.exports = {
  Miner,
};
