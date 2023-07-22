async function wait(tx, { ms = 200 } = {}) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(tx), ms);
  });
}
module.exports = {
  wait,
};
