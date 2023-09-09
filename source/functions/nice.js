function nice(
  n,
  { maxPrecision = 3, minPrecision = 0, base = 1, suffix = "" } = {},
) {
  const options = {
    maxPrecision,
    minPrecision,
    base,
    suffix,
  };
  if (n < 0) {
    return "-" + format(-n, options);
  }
  return format(n, options);
}
function format(
  n,
  { maxPrecision = 3, minPrecision = 0, base = 1, suffix = "" } = {},
) {
  const [text, frac] = split(rescale(n, base), maxPrecision, minPrecision);
  let result = frac + suffix;
  for (let i = text.length - 1; i >= 0; i--) {
    if ((text.length - i) % 3 === 0 && i > 0) {
      result = "'" + text[i] + result;
    } else {
      result = text[i] + result;
    }
  }
  return result;
}
function rescale(n, by) {
  return typeof n === "bigint"
    ? Number(n / BigInt(by)) + Number(n % BigInt(by)) / by
    : n / by;
}
function split(n, maxPrecision, minPrecision) {
  const [lhs, rhs] = n.toFixed(maxPrecision).split(".");
  while (maxPrecision > minPrecision && rhs[maxPrecision - 1] === "0") {
    maxPrecision--;
  }
  return [
    lhs,
    rhs ? (maxPrecision ? "." : "") + rhs.slice(0, maxPrecision) : "",
  ];
}
module.exports = { nice };
