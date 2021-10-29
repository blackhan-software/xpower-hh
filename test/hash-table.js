const fs = require("fs").promises;
const { tmpdir } = require("os");
const { join } = require("path");

const A2N = {}; // amount => nonce
const set_nonce = (a, n) => (A2N[a] = n);
const get_nonce = (a) => A2N[a];
const N2H = {}; // nonce => hash
const set_hash = (a, h) => (N2H[A2N[a]] = h);
const get_hash = (a) => N2H[A2N[a]];

class HashTable {
  constructor(contract) {
    this._contract = contract;
  }

  /** pre-hashes (or restores) nonces, hashes and amounts */
  async init(address, length = 1024) {
    const [date_hour] = new Date().toISOString().split(":");
    const path = join(tmpdir(), `${address}@${date_hour}`);
    //
    // try reading { nonce: [hash, amount] }
    //
    try {
      const text = await fs.readFile(path, {
        encoding: "utf8",
      });
      for (const line of text.trim().split("\n")) {
        const [n, h, a] = JSON.parse(line);
        // console.log('[>>]', n, "=>", h, a);
        set_nonce(a, n);
        set_hash(a, h);
      }
      return this;
    } catch (ex) {
      if (ex.code !== "ENOENT") {
        console.error(ex);
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
      for (let n = 0; n < length; n++) {
        const i = await this._contract.interval();
        const h = await this._contract.hash(n, address, i);
        const a = (await this._contract.amount(h)).toNumber();
        await fs.writeFile(path, `${JSON.stringify([n, h, a])}\n`, {
          encoding: "utf8",
          flag: "a",
        });
        console.log("[<<]", n, "=>", h, a);
        set_nonce(a, n);
        set_hash(a, h);
      }
      return this;
    } catch (ex) {
      console.error(ex);
    }
    return this;
  }

  /** @returns nonce number for provided amount number */
  getNonce({ amount }) {
    return get_nonce(amount);
  }

  /** @returns hash string for provided amount number */
  getHash({ amount }) {
    return get_hash(amount);
  }
}

module.exports = {
  HashTable,
};
