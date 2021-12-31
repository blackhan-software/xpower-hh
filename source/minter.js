const { Token } = require("./token");

async function do_init(
  symbol,
  address,
  { timeout_ms } = { timeout_ms: 60_000 }
) {
  const xpower = await Token.contract(symbol, address);
  return new Promise((resolve, reject) => {
    const tid = setTimeout(() => {
      reject(new Error("[INIT] block-hash timeout"));
    }, timeout_ms);
    const caching = xpower.init();
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
  address,
  { nonce, block_hash, timeout_ms = 60_000 }
) {
  const xpower = await Token.contract(symbol, address);
  return new Promise((resolve, reject) => {
    const tid = setTimeout(() => {
      reject(new Error("[MINT] transaction timeout"));
    }, timeout_ms);
    const minting = xpower.mint("0x" + nonce.toString(16), block_hash);
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
