/**
 * We require the Hardhat Runtime Environment (HRE) explicitly here: The import
 * is optional but useful for running a script in a standalone fashion through:
 *
 * $ node <script>
 *
 * When running the script via `npx hardhat run <script>` you'll find the HRE's
 * members available in the global scope.
 */
const hre = require("hardhat");
const assert = require("assert");

/**
 * Hardhat *always* runs the compile task when running scripts with its command
 * line interface. But, if this script is run *directly* using `node`, then you
 * may want to call compile manually to make sure everything is compiled:
 *
 * > await hre.run('compile');
 */
async function main() {
  const nil = process.env.XPOWER_ADDRESS_NIL;
  assert(nil, "missing XPOWER_ADDRESS_NIL");
  const owner = process.env.OWNER_ADDRESS;
  assert(owner, "missing OWNER_ADDRESS");
  // addresses XPower[Old]
  const cpu_xpower = process.env.XPOWER_ADDRESS_CPU_V2;
  assert(cpu_xpower, "missing XPOWER_ADDRESS_CPU_V2");
  const gpu_xpower = process.env.XPOWER_ADDRESS_GPU_V2;
  assert(gpu_xpower, "missing XPOWER_ADDRESS_GPU_V2");
  const asc_xpower = process.env.XPOWER_ADDRESS_ASC_V2;
  assert(asc_xpower, "missing XPOWER_ADDRESS_ASC_V2");
  // addresses XPowerNft[Uri]
  const cpu_uri = process.env.XPOWER_NFT_URI_CPU;
  assert(cpu_uri, "missing XPOWER_NFT_URI_CPU");
  const gpu_uri = process.env.XPOWER_NFT_URI_GPU;
  assert(gpu_uri, "missing XPOWER_NFT_URI_GPU");
  const asc_uri = process.env.XPOWER_NFT_URI_ASC;
  assert(asc_uri, "missing XPOWER_NFT_URI_ASC");
  //
  // deploy XPowerCpuNft[Old]:
  //
  const cpu = await deploy("XPowerCpuNft", {
    base: nil,
    uri: cpu_uri,
    xpower: cpu_xpower,
    owner,
  });
  console.log("[DEPLOY] XPowerCpuNft[Old] contract to:", cpu.address);
  //
  // deploy XPowerGpuNft[Old]:
  //
  const gpu = await deploy("XPowerGpuNft", {
    base: nil,
    uri: gpu_uri,
    xpower: gpu_xpower,
    owner,
  });
  console.log("[DEPLOY] XPowerGpuNft[Old] contract to:", gpu.address);
  //
  // deploy XPowerAscNft[Old]:
  //
  const asc = await deploy("XPowerAsicNft", {
    base: nil,
    uri: asc_uri,
    xpower: asc_xpower,
    owner,
  });
  console.log("[DEPLOY] XPowerAscNft[Old] contract to:", asc.address);
  //
  // show ownership address:
  //
  console.log("[DEPLOY] ... and with the ownership at:", owner);
}
async function deploy(name, { base, uri, xpower, owner }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(uri, xpower, base);
  await contract.deployed();
  await contract.transferOwnership(owner);
  return contract;
}
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
exports.main = main;
