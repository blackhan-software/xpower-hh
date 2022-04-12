const { ethers } = require("hardhat");
const fs = require("fs").promises;
const { tmpdir } = require("os");
const { join } = require("path");

const { large_random } = require("../source/cluster");
const { Miner } = require("../source/miner");
const { Token } = require("../source/token");

class HashTable {
  constructor(contract, address) {
    this._contract = contract;
    this._address = address;
  }

  /** @returns contract constructed with */
  get contract() {
    return this._contract;
  }

  /** @returns address constructed with */
  get address() {
    return this._address;
  }

  /** pre-hashes (or restores) nonces, hashes and amounts */
  async init({
    length = 4n,
    min_level = 0,
    max_level = 2,
    use_cache = false,
    start = large_random(),
  } = {}) {
    const address = this.address;
    const at_interval = Miner.interval();
    const symbol = await this.contract.symbol();
    const [date] = new Date().toISOString().split("T");
    const name = `${address}:${symbol}@${date}I${at_interval}[L${min_level}…${max_level}:${length}]`;
    const path = join(tmpdir(), name);
    //
    // try reading { nonce: [hash, amount] }
    //
    if (use_cache) {
      try {
        const text = await fs.readFile(path, {
          encoding: "utf8",
        });
        for (const line of text.trim().split("\n")) {
          const [x, bh, h, a] = JSON.parse(line);
          // if (a) {
          //   console.log('[>>]', x, "=>", h, a);
          // }
          this.set_nonce(a, [x, bh]);
          this.set_hash(a, h);
        }
        return this;
      } catch (ex) {
        if (ex.code !== "ENOENT") {
          console.error(ex);
        }
      }
    }
    //
    // clear pre-existing data (if any)
    //
    if (use_cache) {
      await fs.writeFile(path, "", {
        encoding: "utf8",
        flag: "w",
      });
    }
    //
    // try writing { nonce: [hash, amount] }
    //
    const mine = await new Miner().init(max_level);
    const token = new Token(symbol);
    const min_threshold = token.threshold(min_level);
    const max_threshold = token.threshold(max_level);
    try {
      const { hash: block_hash } = await ethers.provider.getBlock(
        (await ethers.provider.getBlockNumber()) - 1
      );
      for (let nonce = start; length > 0; nonce++) {
        const x = "0x" + nonce.toString(16); // hexadecimal nonce
        const h = mine(symbol, address, at_interval, block_hash, nonce);
        const a = token.amount_of(h);
        if (a < min_threshold) {
          continue;
        }
        if (a === max_threshold) {
          length--;
        }
        if (use_cache) {
          await fs.writeFile(
            path,
            `${JSON.stringify([x, block_hash, h, a])}\n`,
            {
              encoding: "utf8",
              flag: "a",
            }
          );
        }
        // if (a) {
        //   console.log("[<<]", x, "=>", h, a);
        // }
        this.set_nonce(a, [x, block_hash]);
        this.set_hash(a, h);
      }
      return this;
    } catch (ex) {
      console.error(ex);
    }
    return this;
  }

  /** @returns [nonce, block-hash] for amount */
  nextNonce({ amount }) {
    if (this._index === undefined) {
      this._index = [];
    }
    if (this._index[amount] === undefined) {
      this._index[amount] = 0;
    }
    const [nonce, block_hash] = this.get_nonce(amount, this._index[amount]++);
    return [ethers.BigNumber.from(nonce), block_hash];
  }

  /** @returns [nonce, block-hash] for amount */
  getNonce({ amount, index = 0 }) {
    const [nonce, block_hash] = this.get_nonce(amount, index);
    return [ethers.BigNumber.from(nonce), block_hash];
  }

  /** @returns hash for amount */
  getHash({ amount }) {
    return this.get_hash(amount);
  }

  /** resets all indices for next nonce(s) */
  reset() {
    this._index = [];
  }

  /** nbh-cache[amount] = [nonce, block-hash] */
  set_nonce(amount, [nonce, block_hash]) {
    if (this._A2NBH === undefined) {
      this._A2NBH = {};
    }
    if (this._A2NBH[amount] === undefined) {
      this._A2NBH[amount] = [];
    }
    this._A2NBH[amount].unshift(`${nonce}:${block_hash}`);
  }

  /** @returns nbh-cache[amount] => [nonce, block_hash] */
  get_nonce(amount, index = 0) {
    if (this._A2NBH === undefined) {
      this._A2NBH = {};
    }
    if (this._A2NBH[amount] === undefined) {
      this._A2NBH[amount] = [];
    }
    const nbh = this._A2NBH[amount][index];
    if (typeof nbh !== "string") {
      throw new Error(`no nonce for amount=${amount} (@index=${index})`);
    }
    return nbh.split(":");
  }

  /** hash-cache[amount] = hash */
  set_hash(amount, hash) {
    if (this._NBH2H === undefined) {
      this._NBH2H = {};
    }
    const nbh = this.get_nonce(amount);
    this._NBH2H[nbh.join(":")] = hash;
  }

  /** @returns hash-cache[amount] => hash */
  get_hash(amount) {
    if (this._NBH2H === undefined) {
      this._NBH2H = {};
    }
    const nbh = this.get_nonce(amount);
    const h = this._NBH2H[nbh.join(":")];
    if (typeof h !== "string") {
      throw new Error(`no hash for amount=${amount}`);
    }
    return h;
  }
}
module.exports = {
  HashTable,
};
