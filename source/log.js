const winston = require("winston");
winston.add(new winston.transports.Console());
winston.level = "debug";
const log_init = (logger) => {
  return ({ worker, result, block_hash, timestamp, symbol, json = false }) => {
    if (json) {
      logger({
        action: "init",
        worker,
        result,
        block_hash,
        timestamp,
        symbol,
      });
    } else {
      logger(
        `[INIT#${worker}|${
          result ?? "..."
        }] block_hash=${block_hash}, timestamp=${timestamp} => ${symbol}`
      );
    }
  };
};
const log_mint = (logger) => {
  return ({
    worker,
    result,
    block_hash,
    nonce,
    amount,
    symbol,
    hms,
    json = false,
  }) => {
    nonce = "0x" + nonce.toString(16);
    hms = ("000" + hms.toFixed(3)).slice(-7);
    if (json) {
      logger({
        action: "mint",
        worker,
        result,
        block_hash,
        nonce,
        amount,
        symbol,
        hms,
      });
    } else {
      logger(
        `[MINT#${worker}|${
          result ?? "..."
        }] nonce=${nonce}, block_hash=${block_hash} => ${amount} ${symbol} [${hms} H/ms]`
      );
    }
  };
};
exports.log_init = (options) => log_init(winston.info)(options);
exports.log_mint = (options) => log_mint(winston.info)(options);
exports.dbg_mint = (options) => log_mint(winston.debug)(options);
exports.err_mint = (options) => log_mint(winston.error)(options);
exports.logger = winston;
