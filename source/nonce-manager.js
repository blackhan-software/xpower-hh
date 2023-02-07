const { ethers } = require("ethers");

class NonceManager extends ethers.Signer {
  get signer() {
    return this._signer;
  }

  get provider() {
    return this._provider;
  }

  constructor(signer, repeat) {
    super();
    this._counter = 0;
    this._signer = signer;
    this._repeat = repeat ?? 3;
    this._provider = signer.provider || null;
  }

  connect(provider) {
    return new NonceManager(this.signer.connect(provider));
  }

  getAddress() {
    return this.signer.getAddress();
  }

  getTransactionCount(tag) {
    if (tag === "pending") {
      if (!this._initial) {
        this._initial = this.signer.getTransactionCount("pending");
      }
      const counter = this._counter;
      return this._initial.then((initial) => initial + counter);
    }
    return this.signer.getTransactionCount(tag);
  }

  setTransactionCount(count) {
    this._initial = Promise.resolve(count).then((nonce) => {
      return ethers.BigNumber.from(nonce).toNumber();
    });
    this._counter = 0;
  }

  incrementTransactionCount(count) {
    this._counter += count === null || count === undefined ? 1 : count;
  }

  signMessage(message) {
    return this.signer.signMessage(message);
  }

  signTransaction(tx) {
    return this.signer.signTransaction(tx);
  }

  async sendTransaction(tx, n) {
    if (tx.nonce === null || tx.nonce === undefined) {
      tx = { ...tx, nonce: this.getTransactionCount("pending") };
      this.incrementTransactionCount();
    } else {
      this.setTransactionCount(tx.nonce);
      this.incrementTransactionCount();
    }
    try {
      return await this.signer.sendTransaction(tx).then((tx) => tx);
    } catch (ex) {
      if (n === undefined || n < this._repeat) {
        return await this.sendTransaction({ ...tx, nonce: null }, (n ?? 0) + 1);
      }
      throw ex;
    }
  }
}
module.exports = { NonceManager };
