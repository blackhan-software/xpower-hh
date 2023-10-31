const { KeccakHasher } = require("wasm-miner");
const { solidityPacked } = require("ethers");
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

  async init(contract, address, block_hash, nonce_length) {
    const hasher = await KeccakHasher();
    const array = this.abi_encode(contract, address, block_hash, nonce_length);
    return (nonce) => {
      array.set(nonce, 52);
      return hasher.digest(array);
    };
  }

  abi_encode(contract, address, block_hash, nonce_length) {
    const template = solidityPacked(
      ["uint160", "bytes32", "bytes"],
      [
        BigInt(contract) ^ BigInt(address),
        block_hash,
        new Uint8Array(nonce_length),
      ],
    );
    return arrayify(template.slice(2));
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
