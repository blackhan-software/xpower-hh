const { parseUnits } = require("ethers").utils;
const { BigNumber } = require("ethers");
const { Token } = require("./token");

async function do_init(
  symbol,
  [minter],
  { timeout_ms } = { timeout_ms: 180_000 }
) {
  const xpower = await Token.contract(symbol, minter);
  const interval = await xpower.currentInterval();
  const block_hash = await xpower.blockHashOf(interval);
  if (!BigNumber.from(block_hash).isZero()) {
    return Promise.resolve({
      block_hash,
      timestamp: interval,
    });
  }
  const { gasMultiplier: gas_multiplier } = hre.network.config;
  const [signer] = await hre.ethers.getSigners();
  const gas_price = await signer.getGasPrice();
  const gas_fee = gas_price.mul((gas_multiplier ?? 1) * 1000).div(1000);
  const gas_fee_priority = parseUnits("2.00", "gwei"); // nAVAX
  return new Promise((resolve, reject) => {
    const tid = setTimeout(() => {
      reject(new Error("[INIT] block-hash timeout"));
    }, timeout_ms);
    const caching = xpower.init({
      maxFeePerGas: Math.max(gas_fee_priority, gas_fee),
      maxPriorityFeePerGas: gas_fee_priority,
      gasLimit: 250_000,
    });
    xpower.on("Init", async function listener(block_hash, timestamp, ev) {
      try {
        const cached = await caching;
        if (ev.transactionHash === cached.hash) {
          clearTimeout(tid);
          xpower.off("Init", listener);
          resolve({ block_hash, timestamp });
        }
      } catch (ex) {
        reject(ex);
      }
    });
  });
}
async function do_mint(
  symbol,
  [minter, beneficiary],
  { block_hash, nonce, timeout_ms = 60_000 }
) {
  const { gasMultiplier: gas_multiplier } = hre.network.config;
  const xpower = await Token.contract(symbol, minter);
  const [signer] = await hre.ethers.getSigners();
  const gas_price = await signer.getGasPrice();
  const gas_fee = gas_price.mul((gas_multiplier ?? 1) * 1000).div(1000);
  const gas_fee_priority = parseUnits("1.25", "gwei"); // nAVAX
  return new Promise((resolve, reject) => {
    const tid = setTimeout(() => {
      reject(new Error("[MINT] transaction timeout"));
    }, timeout_ms);
    const minting = xpower.mint(
      beneficiary,
      block_hash,
      "0x" + nonce.toString(16),
      {
        maxFeePerGas: Math.max(gas_fee_priority, gas_fee),
        maxPriorityFeePerGas: gas_fee_priority,
        gasLimit: 250_000,
      }
    );
    xpower.on("Transfer", async function listener(from, to, amount, ev) {
      try {
        const minted = await minting;
        if (ev.transactionHash === minted.hash) {
          clearTimeout(tid);
          xpower.off("Transfer", listener);
          resolve({ from, to, amount });
        }
      } catch (ex) {
        reject(ex);
      }
    });
  });
}
exports.do_init = do_init;
exports.do_mint = do_mint;
