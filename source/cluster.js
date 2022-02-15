const { BigNumber } = require("ethers");
const crypto = require("crypto");

const { log } = require("./log");
const { block } = require("./block");
const { Token } = require("./token");
const { do_init, do_mint } = require("./minter");
const { miner, expired, interval } = require("./miner");

const cluster = require("cluster");
const process = require("process");
const { cpus } = require("os");
const { assert } = require("console");

async function start(
  symbol,
  address,
  { cache, refresh, mint, level, n_workers = workers() }
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
        cache,
        refresh,
        block_hash,
        timestamp,
        mint,
        level,
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
      if (!refresh || (await expired(timestamp)) === false) {
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
  { cache, refresh, block_hash, timestamp, mint, level }
) {
  let at_interval = interval();
  let nonce = large_random();
  const { start, now } = { start: nonce, now: performance.now() };
  const mine = await miner(level);
  const token = new Token(symbol);
  const threshold = token.threshold(level);
  while (true) {
    const hashed = mine(symbol, address, at_interval, block_hash, nonce);
    const amount = token.amount_of(hashed);
    if (amount >= threshold) {
      const hms = Number(nonce - start) / (performance.now() - now);
      if (mint) {
        try {
          await do_mint(symbol, address, { nonce, block_hash });
          log(`[MINT#${worker_id()}|ACK]`, nonce, amount, symbol, hms);
        } catch (ex) {
          if (ex.message?.match(/replacement fee too low/)) {
            log(`[MINT#${worker_id()}!FTL]`, nonce, amount, symbol, hms);
          } else if (ex.message?.match(/cannot estimate gas/)) {
            log(`[MINT#${worker_id()}!CEG]`, nonce, amount, symbol, hms);
          } else if (ex.message?.match(/nonce has already been used/)) {
            log(`[MINT#${worker_id()}!NAU]`, nonce, amount, symbol, hms);
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
      at_interval = interval();
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
