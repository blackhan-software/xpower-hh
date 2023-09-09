const { nice } = require("./nice");

function nice_si(n, { maxPrecision = 3, minPrecision = 0, base = 1 } = {}) {
  const options = {
    maxPrecision,
    minPrecision,
    base,
  };
  if (n < 0) {
    return "-" + format(-n, options);
  }
  return format(n, options);
}
function format(n, { maxPrecision = 3, minPrecision = 0, base = 1 } = {}) {
  if (n < 1e3 * base)
    return (0, nice)(rescale(n, 1) / base, { maxPrecision, minPrecision });
  if (n < 1e6 * base)
    return (0, nice)(rescale(n, 1e3) / base, {
      maxPrecision,
      minPrecision,
      suffix: "K",
    });
  if (n < 1e9 * base)
    return (0, nice)(rescale(n, 1e6) / base, {
      maxPrecision,
      minPrecision,
      suffix: "M",
    });
  if (n < 1e12 * base)
    return (0, nice)(rescale(n, 1e9) / base, {
      maxPrecision,
      minPrecision,
      suffix: "G",
    });
  if (n < 1e15 * base)
    return (0, nice)(rescale(n, 1e12) / base, {
      maxPrecision,
      minPrecision,
      suffix: "T",
    });
  if (n < 1e18 * base)
    return (0, nice)(rescale(n, 1e15) / base, {
      maxPrecision,
      minPrecision,
      suffix: "P",
    });
  if (n < 1e21 * base)
    return (0, nice)(rescale(n, 1e18) / base, {
      maxPrecision,
      minPrecision,
      suffix: "E",
    });
  if (n < 1e24 * base)
    return (0, nice)(rescale(n, 1e21) / base, {
      maxPrecision,
      minPrecision,
      suffix: "Z",
    });
  if (n < 1e27 * base)
    return (0, nice)(rescale(n, 1e24) / base, {
      maxPrecision,
      minPrecision,
      suffix: "Y",
    });
  if (typeof n === "bigint") {
    return (n / BigInt(base)).toLocaleString("en-US", {
      maximumFractionDigits: digits(maxPrecision),
      minimumFractionDigits: digits(minPrecision),
      notation: "scientific",
    });
  } else {
    return (n / base).toLocaleString("en-US", {
      maximumFractionDigits: digits(maxPrecision),
      minimumFractionDigits: digits(minPrecision),
      notation: "scientific",
    });
  }
}
function rescale(n, by) {
  return typeof n === "bigint"
    ? Number(n / BigInt(by)) + Number(n % BigInt(by)) / by
    : n / by;
}
function digits(precision) {
  switch (Math.round(precision)) {
    case 0:
      return 0;
    case 1:
      return 1;
    case 2:
      return 2;
    case 3:
      return 3;
    case 4:
      return 4;
    case 5:
      return 5;
    case 6:
      return 6;
    case 7:
      return 7;
    case 8:
      return 8;
    case 9:
      return 9;
    case 10:
      return 10;
    case 11:
      return 11;
    case 12:
      return 12;
    case 13:
      return 13;
    case 14:
      return 14;
    case 15:
      return 15;
    case 16:
      return 16;
    case 17:
      return 17;
    case 18:
      return 18;
    case 19:
      return 19;
    case 20:
      return 20;
  }
  return undefined;
}
module.exports = { nice_si };
