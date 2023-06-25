function unify(...arrays) {
  return [...new Set(arrays.reduce((a, b) => a.concat(b), []))];
}
module.exports = { unify };
