function zip(...arrays) {
  const zipped = [];
  if (arrays.length > 0) {
    for (let i = 0; i < arrays[0].length; i++) {
      const packed = [];
      for (let j = 0; j < arrays.length; j++) {
        packed.push(arrays[j][i]);
      }
      zipped.push(packed);
    }
  }
  return zipped;
}
module.exports = { zip };
