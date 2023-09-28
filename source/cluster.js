const { logger, log_init, log_mint, dbg_mint, err_mint } = require("./log");

const { block } = require("./block");
const { do_init } = require("./minter");
const { do_mint } = require("./minter");
const { Miner } = require("./miner");
const { Token } = require("./token");

const cluster = require("cluster");
const crypto = require("crypto");
const process = require("process");
const { cpus } = require("os");
const { assert } = require("console");

async function start(
  symbols,
  [minter, beneficiary],
  { cache, json, level, mint, nonce_length, n_workers, refresh },
) {
  if (cluster.isPrimary) {
    const { counter } = await fork(n_workers);
    assert(counter === n_workers);
  }
  if (cluster.isPrimary) {
    const { counter } = await ready(n_workers);
    assert(counter === n_workers);
  }
  if (cluster.isPrimary) {
    const initialized = {};
    for (const symbol of symbols) {
      const { block_hash, timestamp } = await init(symbol, [minter], {
        cache,
        json,
      });
      initialized[symbol] = { block_hash, timestamp: Number(timestamp) };
    }
    for (const { id } of Object.values(cluster.workers)) {
      const symbol = symbols[(Number(id) - 1) % symbols.length];
      const { block_hash, timestamp } = initialized[symbol];
      const on_exit = exiter({ worker_id: id });
      cluster.workers[id].on("exit", on_exit);
      const restart = restarter({ block_hash, timestamp, symbol });
      cluster.workers[id].on("exit", restart);
      cluster.workers[id].send({ block_hash, timestamp, symbol });
    }
  }
  if (cluster.isWorker) {
    process.on("message", function on_init({ block_hash, timestamp, symbol }) {
      process.off("message", on_init);
      logger.debug({
        action: "loop",
        worker: worker_id(),
        symbol,
      });
      loop(symbol, [minter, beneficiary], {
        block_hash,
        cache,
        level,
        mint,
        nonce_length,
        refresh,
        timestamp,
        json,
      });
    });
  }
  if (cluster.isWorker) {
    process.send({ ready: true });
  }
  return await busy();
}
function workers() {
  return cpus().length - 1;
}
function worker_id() {
  return cluster.worker?.id ?? 0;
}
function exiter({ worker_id }) {
  return (code, signal) => {
    if (signal) {
      logger.debug({ action: "exit", worker: worker_id, signal });
    } else if (code !== 0) {
      logger.debug({ action: "exit", worker: worker_id, error: code });
    } else {
      logger.debug({ action: "exit", worker: worker_id });
    }
  };
}
function restarter({ block_hash, timestamp, symbol }) {
  return async (code) => {
    if (code !== 0) {
      const { counter: n_forked, workers } = await fork(1);
      assert(n_forked === 1 && workers.length === 1);
      const { counter: n_ready } = await ready(1);
      assert(n_ready === 1);
      workers[0].send({ block_hash, timestamp, symbol });
    }
  };
}
async function fork(n_workers, counter = 0, workers = []) {
  return await new Promise((resolve) => {
    cluster.on("fork", function increment() {
      if (++counter === n_workers) {
        cluster.off("fork", increment);
        resolve({ counter, workers });
      }
    });
    for (let i = 0; i < n_workers; i++) {
      workers.push(cluster.fork());
    }
  });
}
async function ready(n_workers, counter = 0) {
  return await new Promise((resolve) => {
    cluster.on("message", function on_ready() {
      if (++counter === n_workers) {
        cluster.off("message", on_ready);
        resolve({ counter });
      }
    });
  });
}
async function busy() {
  return new Promise(() => {});
}
async function init(
  symbol,
  [minter],
  { block_hash, timestamp, cache, refresh, json },
) {
  if (cache) {
    if (typeof refresh === "boolean") {
      if (!refresh || (await Miner.expired(timestamp)) === false) {
        return { block_hash, timestamp };
      }
    }
    logger.debug({ action: "init", worker: worker_id(), symbol });
    ({ block_hash, timestamp } = await do_init(symbol, [minter]));
    log_init({
      worker: worker_id(),
      result: "ACK",
      block_hash,
      timestamp,
      symbol,
      json,
    });
  } else {
    logger.debug({ action: "init", worker: worker_id(), symbol });
    ({ hash: block_hash, timestamp } = await block());
    log_init({
      worker: worker_id(),
      result: "blk",
      block_hash,
      timestamp,
      symbol,
      json,
    });
  }
  return { block_hash, timestamp };
}
async function loop(
  symbol,
  [minter, beneficiary],
  { block_hash, cache, json, level, mint, nonce_length, refresh, timestamp },
) {
  const [nonce, start] = large_random(nonce_length);
  const { target } = await Token.contract(symbol, minter);
  const mine = await new Miner().init(
    target,
    beneficiary,
    block_hash,
    nonce_length,
  );
  const token = new Token(symbol);
  const threshold = token.threshold(level);
  const now = performance.now();
  while (true) {
    const amount = token.amount_of(mine(nonce));
    if (amount >= threshold) {
      const hms =
        Number(nonce.readBigUInt64BE() - start) / (performance.now() - now);
      if (mint) {
        try {
          dbg_mint({
            worker: worker_id(),
            block_hash,
            nonce,
            amount,
            symbol,
            hms,
            json,
          });
          await do_mint(symbol, [minter, beneficiary], {
            block_hash,
            nonce,
          });
          log_mint({
            worker: worker_id(),
            result: "ACK",
            block_hash,
            nonce,
            amount,
            symbol,
            hms,
            json,
          });
        } catch (ex) {
          const result = ex.message?.match(/nonce has already been used/)
            ? "NAU"
            : ex.message?.match(/replacement fee too low/)
            ? "FIL"
            : ex.message?.match(/cannot estimate gas/)
            ? "CEG"
            : null;
          if (result) {
            err_mint({
              worker: worker_id(),
              result,
              block_hash,
              nonce,
              amount,
              symbol,
              hms,
              json,
            });
          } else {
            logger.error(ex);
          }
        }
        ({ block_hash, timestamp } = await init(symbol, [minter], {
          block_hash,
          timestamp,
          cache,
          refresh,
          json,
        }));
      } else {
        log_mint({
          worker: worker_id(),
          result: "NIL",
          block_hash,
          nonce,
          amount,
          symbol,
          hms,
          json,
        });
      }
    }
    increment(nonce);
  }
}
function large_random(length) {
  const bytes = crypto.randomBytes(length);
  if (bytes[0] > 15) {
    return [bytes, bytes.readBigUInt64BE()];
  }
  return large_random(length);
}
function increment(nonce, index = 0) {
  if (nonce[index]++) {
    return;
  }
  increment(nonce, (index + 1) % nonce.length);
}
exports.start = start;
exports.workers = workers;
exports.increment = increment;
exports.large_random = large_random;
