const { parseUnits } = require("ethers").utils;
const { Token } = require("./token");

async function do_init(
  symbol,
  [minter],
  { timeout_ms } = { timeout_ms: 180_000 }
) {
  const { gasMultiplier: gas_multiplier } = hre.network.config;
  const xpower = await Token.contract(symbol, minter);
  const [signer] = await hre.ethers.getSigners();
  const gas_price = await signer.getGasPrice();
  return new Promise((resolve, reject) => {
    const tid = setTimeout(() => {
      reject(new Error("[INIT] block-hash timeout"));
    }, timeout_ms);
    const caching = xpower.init({
      maxFeePerGas: gas_price.mul(gas_multiplier * 1000).div(1000),
      maxPriorityFeePerGas: parseUnits("2.0", "gwei"), // nAVAX
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
  { nonce, block_hash, timeout_ms = 60_000 }
) {
  const { gasMultiplier: gas_multiplier } = hre.network.config;
  const xpower = await Token.contract(symbol, minter);
  const [signer] = await hre.ethers.getSigners();
  const gas_price = await signer.getGasPrice();
  return new Promise((resolve, reject) => {
    const tid = setTimeout(() => {
      reject(new Error("[MINT] transaction timeout"));
    }, timeout_ms);
    const minting = xpower.mint(
      beneficiary,
      block_hash,
      "0x" + nonce.toString(16),
      {
        maxFeePerGas: gas_price.mul(gas_multiplier * 1000).div(1000),
        maxPriorityFeePerGas: parseUnits("1.5", "gwei"), // nAVAX
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
