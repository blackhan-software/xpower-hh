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
  const owner = process.env.OWNER_ADDRESS;
  assert(owner, "missing OWNER_ADDRESS");
  // addresses XPower[New]
  const cpu_xpower = process.env.XPOWER_ADDRESS_CPU_V3;
  assert(cpu_xpower, "missing XPOWER_ADDRESS_CPU_V3");
  const gpu_xpower = process.env.XPOWER_ADDRESS_GPU_V3;
  assert(gpu_xpower, "missing XPOWER_ADDRESS_GPU_V3");
  const asc_xpower = process.env.XPOWER_ADDRESS_ASC_V3;
  assert(asc_xpower, "missing XPOWER_ADDRESS_ASC_V3");
  // addresses XPowerNft[Uri]
  const cpu_uri = process.env.XPOWER_NFT_URI_CPU;
  assert(cpu_uri, "missing XPOWER_NFT_URI_CPU");
  const gpu_uri = process.env.XPOWER_NFT_URI_GPU;
  assert(gpu_uri, "missing XPOWER_NFT_URI_GPU");
  const asc_uri = process.env.XPOWER_NFT_URI_ASC;
  assert(asc_uri, "missing XPOWER_NFT_URI_ASC");
  // addresses XPowerNft[Old]
  const cpu_base = process.env.XPOWER_NFT_ADDRESS_CPU_V2;
  assert(cpu_base, "missing XPOWER_NFT_ADDRESS_CPU_V2");
  const gpu_base = process.env.XPOWER_NFT_ADDRESS_GPU_V2;
  assert(gpu_base, "missing XPOWER_NFT_ADDRESS_GPU_V2");
  const asc_base = process.env.XPOWER_NFT_ADDRESS_ASC_V2;
  assert(asc_base, "missing XPOWER_NFT_ADDRESS_ASC_V2");
  //
  // deploy XPowerCpuNft[New]:
  //
  const cpu = await deploy("XPowerCpuNft", {
    base: cpu_base,
    uri: cpu_uri,
    xpower: cpu_xpower,
    owner,
  });
  console.log("[DEPLOY] XPowerCpuNft[New] contract to:", cpu.address);
  //
  // deploy XPowerGpuNft[New]:
  //
  const gpu = await deploy("XPowerGpuNft", {
    base: gpu_base,
    uri: gpu_uri,
    xpower: gpu_xpower,
    owner,
  });
  console.log("[DEPLOY] XPowerGpuNft[New] contract to:", gpu.address);
  //
  // deploy XPowerAscNft[New]:
  //
  const asc = await deploy("XPowerAsicNft", {
    base: asc_base,
    uri: asc_uri,
    xpower: asc_xpower,
    owner,
  });
  console.log("[DEPLOY] XPowerAscNft[New] contract to:", asc.address);
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
