const { solidityPack } = require("ethers/lib/utils");
const { createKeccak } = require("hash-wasm");
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
    const hasher = await createKeccak(256);
    const abi_encode = this.abi_encoder(nonce_length);
    return (contract, address, block_hash, nonce) => {
      const data = abi_encode(contract, address, block_hash, nonce);
      const hash = hasher.init().update(data).digest("binary");
      return hash;
    };
  }

  abi_encoder(nonce_length) {
    return (contract, address, block_hash, nonce) => {
      let value = this.abi_encoded[block_hash];
      if (value === undefined) {
        const template = solidityPack(
          ["uint160", "bytes32", "bytes"],
          [
            BigInt(contract) ^ BigInt(address),
            block_hash,
            new Uint8Array(nonce_length),
          ]
        );
        value = arrayify(template.slice(2));
        this.abi_encoded[block_hash] = value;
      }
      value.set(nonce, 52);
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
