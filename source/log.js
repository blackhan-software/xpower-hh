function log(
  prefix,
  symbol,
  hms,
  { nonce, block_hash, hash, amount, json = false }
) {
  nonce = "0x" + nonce.toString(16);
  hms = ("000" + hms.toFixed(3)).slice(-7);
  if (json) {
    console.log(`${JSON.stringify([nonce, block_hash, hash, amount])}`);
  } else {
    console.log(
      `${prefix} nonce=${nonce}, block_hash=${block_hash} => ${amount} ${symbol} [${hms} H/ms]`
    );
  }
}
exports.log = log;
