const { parseUnits } = require("ethers");
const { Token } = require("./token");

async function do_init(
  symbol,
  [minter],
  { timeout_ms } = { timeout_ms: 180_000 },
) {
  const xpower = await Token.contract(symbol, minter);
  const interval = await xpower.currentInterval();
  const block_hash = await xpower.blockHashOf(interval);
  if (!block_hash.match(/^0x0+$/)) {
    return Promise.resolve({ block_hash, timestamp: interval });
  }
  const { gasMultiplier: gas_multiplier } = hre.network.config;
  const [{ provider }] = await hre.ethers.getSigners();
  const fee_data = await provider.getFeeData();
  const gas_price = fee_data.gasPrice ?? 25n;
  const gas_fee = (gas_price * BigInt((gas_multiplier ?? 1) * 1000)) / 1000n;
  const gas_fee_priority = parseUnits("2.00", "gwei"); // nAVAX
  return new Promise((resolve, reject) => {
    const tid = setTimeout(() => {
      reject(new Error("[INIT] block-hash timeout"));
    }, timeout_ms);
    const sub = xpower.on(
      "Init",
      async function listener(block_hash, timestamp, ev) {
        try {
          const inited = await initing;
          if (ev.log.transactionHash === inited.hash) {
            clearTimeout(tid);
            xpower.off("Init", listener);
            resolve({ block_hash, timestamp });
          }
        } catch (ex) {
          reject(ex);
        }
      },
    );
    const initing = sub.then(() =>
      xpower.init({
        maxFeePerGas: max(gas_fee_priority, gas_fee),
        maxPriorityFeePerGas: gas_fee_priority,
        gasLimit: 250_000,
      }),
    );
  });
}
async function do_mint(
  symbol,
  [minter, beneficiary],
  { block_hash, nonce, timeout_ms = 60_000 },
) {
  const { gasMultiplier: gas_multiplier } = hre.network.config;
  const xpower = await Token.contract(symbol, minter);
  const [{ provider }] = await hre.ethers.getSigners();
  const fee_data = await provider.getFeeData();
  const gas_price = fee_data.gasPrice ?? 25n;
  const gas_fee = (gas_price * BigInt((gas_multiplier ?? 1) * 1000)) / 1000n;
  const gas_fee_priority = parseUnits("1.25", "gwei"); // nAVAX
  return new Promise((resolve, reject) => {
    const tid = setTimeout(() => {
      reject(new Error("[MINT] transaction timeout"));
    }, timeout_ms);
    const sub = xpower.on(
      "Transfer",
      async function listener(from, to, amount, ev) {
        try {
          const minted = await minting;
          if (ev.log.transactionHash === minted.hash) {
            clearTimeout(tid);
            xpower.off("Transfer", listener);
            resolve({ from, to, amount });
          }
        } catch (ex) {
          reject(ex);
        }
      },
    );
    const minting = sub.then(() =>
      xpower.mint(
        beneficiary,
        block_hash,
        "0x" + Buffer.from(nonce).toString("hex"),
        {
          maxFeePerGas: max(gas_fee_priority, gas_fee),
          maxPriorityFeePerGas: gas_fee_priority,
          gasLimit: 250_000,
        },
      ),
    );
  });
}
function max(lhs, rhs) {
  return lhs > rhs ? lhs : rhs;
}
exports.do_init = do_init;
exports.do_mint = do_mint;
