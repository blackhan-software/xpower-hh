const { BigNumber } = require("ethers");
const crypto = require("crypto");

const { log } = require("./log");
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
  symbol,
  address,
  { cache, json, level, mint, refresh, n_workers = workers() }
) {
  if (cluster.isPrimary) {
    console.log("[CLUSTER]", `master = ${worker_id()} state = setup`);
  }
  if (cluster.isPrimary) {
    const { counter } = await fork(n_workers);
    assert(counter === n_workers);
  }
  if (cluster.isPrimary) {
    const { counter } = await ready(n_workers);
    assert(counter === n_workers);
  }
  if (cluster.isPrimary) {
    const { block_hash, timestamp } = await init(symbol, address, {
      cache,
    });
    for (const id in cluster.workers) {
      const on_exit = exiter({ worker_id: id });
      cluster.workers[id].on("exit", on_exit);
      const restart = restarter({ block_hash, timestamp });
      cluster.workers[id].on("exit", restart);
      cluster.workers[id].send({
        block_hash,
        timestamp,
      });
    }
  }
  if (cluster.isWorker) {
    console.log("[CLUSTER]", `worker = ${worker_id()} state = ready`);
  }
  if (cluster.isWorker) {
    process.on("message", function on_init({ block_hash, timestamp }) {
      process.off("message", on_init);
      loop(symbol, address, {
        block_hash,
        cache,
        level,
        json,
        mint,
        refresh,
        timestamp,
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
      console.log(`[EXIT#${worker_id}] killed by SIGNAL = ${signal}`);
    } else if (code !== 0) {
      console.log(`[EXIT#${worker_id}] exited with error code = ${code}`);
    } else {
      console.log(`[EXIT#${worker_id}] exited successfully`);
    }
  };
}
function restarter({ block_hash, timestamp }) {
  return async (code) => {
    if (code !== 0) {
      const { counter: n_forked, workers } = await fork(1);
      assert(n_forked === 1 && workers.length === 1);
      const { counter: n_ready } = await ready(1);
      assert(n_ready === 1);
      workers[0].send({
        block_hash,
        timestamp,
      });
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
  address,
  { cache, refresh, block_hash, timestamp }
) {
  if (cache) {
    if (typeof refresh === "boolean") {
      if (!refresh || (await Miner.expired(timestamp)) === false) {
        return { block_hash, timestamp };
      }
    }
    ({ block_hash, timestamp } = await do_init(symbol, address));
    console.log(
      `[INIT#${worker_id()}|ACK]` +
        ` block-hash = ${block_hash}` +
        ` timestamp = ${timestamp}`
    );
  } else {
    ({ hash: block_hash, timestamp } = await block());
    console.log(
      `[INIT#${worker_id()}|BLK]` +
        ` block-hash = ${block_hash}` +
        ` timestamp = ${timestamp}`
    );
  }
  return { block_hash, timestamp };
}
async function loop(
  symbol,
  address,
  { block_hash, cache, level, json, mint, refresh, timestamp }
) {
  let at_interval = Miner.interval();
  let nonce = large_random();
  const { start, now } = { start: nonce, now: performance.now() };
  const mine = await new Miner().init(level);
  const token = new Token(symbol);
  const threshold = token.threshold(level);
  while (true) {
    const hash = mine(symbol, address, at_interval, block_hash, nonce);
    const amount = token.amount_of(hash);
    if (amount >= threshold) {
      const hms = Number(nonce - start) / (performance.now() - now);
      const ctx = {
        amount,
        block_hash,
        hash,
        nonce,
        json,
      };
      if (mint) {
        try {
          await do_mint(symbol, address, { nonce, block_hash });
          log(`[MINT#${worker_id()}|ACK]`, symbol, hms, ctx);
        } catch (ex) {
          if (ex.message?.match(/replacement fee too low/)) {
            log(`[MINT#${worker_id()}!FTL]`, symbol, hms, ctx);
          } else if (ex.message?.match(/cannot estimate gas/)) {
            log(`[MINT#${worker_id()}!CEG]`, symbol, hms, ctx);
          } else if (ex.message?.match(/nonce has already been used/)) {
            log(`[MINT#${worker_id()}!NAU]`, symbol, hms, ctx);
          } else {
            console.error(ex);
          }
        }
        ({ block_hash, timestamp } = await init(symbol, address, {
          cache,
          refresh,
          block_hash,
          timestamp,
        }));
      } else {
        log(`[WORK#${worker_id()}]`, nonce, amount, symbol, hms);
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
