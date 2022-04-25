const { BigNumber } = require("ethers");
const crypto = require("crypto");

const { logger, log_init, log_mint, dbg_mint, err_mint } = require("./log");

const { block } = require("./block");
const { do_init } = require("./minter");
const { do_mint } = require("./minter");
const { Miner } = require("./miner");
const { Token } = require("./token");

const cluster = require("cluster");
const process = require("process");
const { cpus } = require("os");
const { assert } = require("console");

async function start(
  symbols,
  [minter, beneficiary],
  { cache, json, level, mint, refresh, n_workers }
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
      initialized[symbol] = { block_hash, timestamp };
    }
    for (const id in cluster.workers) {
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
  { block_hash, timestamp, cache, refresh, json }
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
  { block_hash, timestamp, level, cache, mint, refresh, json }
) {
  let at_interval = Miner.interval();
  let nonce = large_random();
  const { start, now } = { start: nonce, now: performance.now() };
  const mine = await new Miner().init(level);
  const token = new Token(symbol);
  const threshold = token.threshold(level);
  while (true) {
    const hash = mine(symbol, beneficiary, at_interval, block_hash, nonce);
    const amount = token.amount_of(hash);
    if (amount >= threshold) {
      const hms = Number(nonce - start) / (performance.now() - now);
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
          await do_mint(symbol, [minter, beneficiary], { nonce, block_hash });
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
          if (ex.message?.match(/replacement fee too low/)) {
            err_mint({
              worker: worker_id(),
              result: "FIL",
              block_hash,
              nonce,
              amount,
              symbol,
              hms,
              json,
            });
          } else if (ex.message?.match(/cannot estimate gas/)) {
            err_mint({
              worker: worker_id(),
              result: "CEG",
              block_hash,
              nonce,
              amount,
              symbol,
              hms,
              json,
            });
          } else if (ex.message?.match(/nonce has already been used/)) {
            err_mint({
              worker: worker_id(),
              result: "NAU",
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
      at_interval = Miner.interval();
    }
    nonce++;
  }
}
function large_random() {
  const bytes = crypto.randomBytes(32);
  if (bytes[0] > 15) {
    return BigNumber.from(bytes).toBigInt();
  }
  return large_random();
}
exports.start = start;
exports.workers = workers;
exports.large_random = large_random;
