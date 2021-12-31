async function block() {
  return await hre.ethers.provider.getBlock();
}
exports.block = block;
