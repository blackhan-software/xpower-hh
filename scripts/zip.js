function zip(...arrays) {
  const zipped = [];
  if (arrays.length > 0) {
    for (let i = 0; i < arrays[0].length; i++) {
      for (let j = 0; j < arrays.length; j++) {
        zipped.push(arrays[j][i]);
      }
    }
  }
  return zipped;
}
module.exports = { zip };
