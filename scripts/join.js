function join(...arrays) {
  const joined = [];
  if (arrays.length > 0) {
    for (let i = 0; i < arrays[0].length; i++) {
      for (let j = 0; j < arrays.length; j++) {
        joined.push(arrays[j][i]);
      }
    }
  }
  return joined;
}
module.exports = { join };
