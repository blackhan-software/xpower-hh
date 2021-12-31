const { defaultAbiCoder: abi } = require("ethers/lib/utils");
const { InitializeKeccak } = require("keccak-wasm");
const { keccak256 } = require("keccak-wasm");
const { block } = require("./block");

// cache: (interval: number) => abi.encode(token, nonce, ...)
const abi_encoded = {};
// cache: (level: number) => arrayify(nonce)
const array_cache = {};
// cache: (level: number) => nonce
const nonce_cache = {};

const miner = async (level) => {
  await InitializeKeccak();
  const abi_encode = abi_encoder(level);
  return (token, address, nonce, interval, block_hash) => {
    const data = abi_encode(token, address, nonce, interval, block_hash);
    return "0x" + keccak256(data);
  };
};
const abi_encoder = (level) => {
  const lazy_arrayify = arrayifier(level);
  return (token, address, nonce, interval, block_hash) => {
    let value = abi_encoded[interval];
    if (value === undefined) {
      const template = abi.encode(
        ["string", "uint256", "address", "uint256", "bytes32"],
        [token, 0, address, interval, block_hash]
      );
      abi_encoded[interval] = value = arrayify(template.slice(2));
      array_cache[level] = arrayify(nonce.toString(16));
      nonce_cache[level] = nonce;
    }
    const array = lazy_arrayify(nonce, nonce.toString(16));
    value.set(array, 32);
    return value;
  };
};
const arrayifier = (level) => {
  const diff_max = 16n ** BigInt(level) - 1n;
  const offset_2 = 64 - level * 2;
  const offset_1 = 32 - level;
  return (nonce, hex_nonce) => {
    if (nonce - nonce_cache[level] > diff_max) {
      array_cache[level] = arrayify(hex_nonce);
      nonce_cache[level] = nonce;
    }
    const nonce_rhs = hex_nonce.slice(offset_2);
    const array_rhs = arrayify(nonce_rhs);
    array_cache[level].set(array_rhs, offset_1);
    return array_cache[level];
  };
};
const arrayify = (data, list = []) => {
  for (let i = 0; i < data.length; i += 2) {
    list.push(parseInt(data.substring(i, i + 2), 16));
  }
  return new Uint8Array(list);
};
const interval = (timestamp, ms = 3_600_000) => {
  if (timestamp === undefined) {
    return Math.floor(new Date().getTime() / ms);
  }
  return Math.floor(parseInt(timestamp) / ms);
};
const expired = async (timestamp) => {
  const { timestamp: now } = await block();
  return interval(now) > interval(timestamp);
};
exports.miner = miner;
exports.expired = expired;
exports.interval = interval;
