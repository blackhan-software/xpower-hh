const { ethers } = require("hardhat");
const fs = require("fs").promises;
const { tmpdir } = require("os");
const { join } = require("path");

class HashTable {
  constructor(contract, address) {
    this._contract = contract;
    this._address = address;
  }

  /** pre-hashes (or restores) nonces, hashes and amounts */
  async init(start = 1024, length = 1024, use_cache = false) {
    const [date_hour] = new Date().toISOString().split(":");
    const path = join(tmpdir(), `${this._address}@${date_hour}`);
    //
    // try reading { nonce: [hash, amount] }
    //
    if (use_cache) {
      try {
        const text = await fs.readFile(path, {
          encoding: "utf8",
        });
        for (const line of text.trim().split("\n")) {
          const [n, bh, h, a] = JSON.parse(line);
          // console.log('[>>]', n, "=>", h, a);
          this.set_nonce(a, [n, bh]);
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
    await fs.writeFile(path, "", {
      encoding: "utf8",
      flag: "w",
    });
    //
    // try writing { nonce: [hash, amount] }
    //
    try {
      const { value: block_hash } = await this._contract.init();
      if (!block_hash.isZero()) {
        throw new Error("block_hash != 0");
      }
      for (let n = start; n < start + length; n++) {
        const i = await this._contract.interval();
        const { hash: bh } = await ethers.provider.getBlock(0);
        const h = await this._contract.hash(n, this._address, i, bh);
        const a = (await this._contract.amount(h)).toNumber();
        await fs.writeFile(path, `${JSON.stringify([n, bh, h, a])}\n`, {
          encoding: "utf8",
          flag: "a",
        });
        if (a) console.log("[<<]", n, "=>", h, a);
        this.set_nonce(a, [n, bh]);
        this.set_hash(a, h);
      }
      return this;
    } catch (ex) {
      console.error(ex);
    }
    return this;
  }

  /** @returns [nonce, block-hash] for amount */
  getNonce({ amount }) {
    const [nonce, block_hash] = this.get_nonce(amount);
    return [parseInt(nonce), block_hash];
  }

  /** @returns hash for amount */
  getHash({ amount }) {
    return this.get_hash(amount);
  }

  /** nbh-cache[amount] = [nonce, block-hash] */
  set_nonce(amount, [nonce, block_hash]) {
    if (this._A2NBH === undefined) {
      this._A2NBH = {};
    }
    this._A2NBH[amount] = `${nonce}:${block_hash}`;
  }

  /** @returns nbh-cache[amount] => [nonce, block_hash] */
  get_nonce(amount) {
    return this._A2NBH[amount].split(":");
  }

  /** hash-cache[amount] = hash */
  set_hash(amount, hash) {
    if (this._N2H === undefined) {
      this._N2H = {};
    }
    this._N2H[this._A2NBH[amount]] = hash;
  }

  /** @returns hash-cache[amount] => hash */
  get_hash(amount) {
    return this._N2H[this._A2NBH[amount]];
  }
}

module.exports = {
  HashTable,
};
