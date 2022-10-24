async function wait(tx, { confirm = 1, ms = 2_000 } = {}) {
  return new Promise((resolve) => {
    const tid = setTimeout(() => resolve(tx), ms);
    tx.wait(confirm).then(() => {
      clearTimeout(tid);
      resolve(tx);
    });
  });
}
async function waitAll(txs, { confirm = 1, ms = 2_000 } = {}) {
  return Promise.all(txs.map((tx) => wait(tx, { confirm, ms })));
}
module.exports = {
  wait,
  waitAll,
};
