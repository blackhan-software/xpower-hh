function log(prefix, nonce, amount, symbol, hms) {
  nonce = ellipse(nonce.toString(16));
  hms = ("000" + hms.toFixed(3)).slice(-7);
  console.log(
    `${prefix} nonce = 0x${nonce} => ${amount} ${symbol} [${hms} H/ms]`
  );
}
function ellipse(string, beg = 14, end = -12) {
  return `${string.slice(0, beg)}...${string.slice(end)}`;
}
exports.log = log;
