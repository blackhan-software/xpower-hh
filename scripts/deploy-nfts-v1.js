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
  const nil_address = process.env.XPOWER_ADDRESS_NIL;
  assert(nil_address, "missing XPOWER_ADDRESS_NIL");
  const address_own = process.env.OWNER_ADDRESS;
  assert(address_own, "missing OWNER_ADDRESS");
  // addresses XPower
  const cpu_address = process.env.XPOWER_ADDRESS_CPU;
  assert(cpu_address, "missing XPOWER_ADDRESS_CPU");
  const gpu_address = process.env.XPOWER_ADDRESS_GPU;
  assert(gpu_address, "missing XPOWER_ADDRESS_GPU");
  const asc_address = process.env.XPOWER_ADDRESS_ASC;
  assert(asc_address, "missing XPOWER_ADDRESS_ASC");
  // addresses XPowerNft[Uri]
  const cpu_nft_uri = process.env.XPOWER_NFT_URI_CPU;
  assert(cpu_nft_uri, "missing XPOWER_NFT_URI_CPU");
  const gpu_nft_uri = process.env.XPOWER_NFT_URI_GPU;
  assert(gpu_nft_uri, "missing XPOWER_NFT_URI_GPU");
  const asc_nft_uri = process.env.XPOWER_NFT_URI_ASC;
  assert(asc_nft_uri, "missing XPOWER_NFT_URI_ASC");
  // addresses XPowerNft[Old]
  const cpu_nft_address_v1 = process.env.XPOWER_NFT_ADDRESS_CPU_V1;
  assert(cpu_nft_address_v1, "missing XPOWER_NFT_ADDRESS_CPU_V1");
  const gpu_nft_address_v1 = process.env.XPOWER_NFT_ADDRESS_GPU_V1;
  assert(gpu_nft_address_v1, "missing XPOWER_NFT_ADDRESS_GPU_V1");
  const asc_nft_address_v1 = process.env.XPOWER_NFT_ADDRESS_ASC_V1;
  assert(asc_nft_address_v1, "missing XPOWER_NFT_ADDRESS_ASC_V1");
  //
  // deploy XPowerCpuNft[Old]:
  //
  const v1_cpu_factory = await hre.ethers.getContractFactory("XPowerCpuNft");
  const v1_cpu = await v1_cpu_factory.deploy(
    cpu_nft_uri,
    cpu_address,
    nil_address
  );
  await v1_cpu.deployed();
  console.log("[DEPLOY] XPowerCpuNft[Old] contract to:", v1_cpu.address);
  await v1_cpu.transferOwnership(address_own);
  //
  // deploy XPowerGpuNft[Old]:
  //
  const v1_gpu_factory = await hre.ethers.getContractFactory("XPowerGpuNft");
  const v1_gpu = await v1_gpu_factory.deploy(
    gpu_nft_uri,
    gpu_address,
    nil_address
  );
  await v1_gpu.deployed();
  console.log("[DEPLOY] XPowerGpuNft[Old] contract to:", v1_gpu.address);
  await v1_gpu.transferOwnership(address_own);
  //
  // deploy XPowerAsicNft[Old]:
  //
  const v1_asc_factory = await hre.ethers.getContractFactory("XPowerAsicNft");
  const v1_asc = await v1_asc_factory.deploy(
    asc_nft_uri,
    asc_address,
    nil_address
  );
  await v1_asc.deployed();
  console.log("[DEPLOY] XPowerAscNft[Old] contract to:", v1_asc.address);
  await v1_asc.transferOwnership(address_own);
  //
  // show ownership address:
  //
  console.log("[DEPLOY] ... and with the ownership at:", address_own);
}

/**
 * We recommend this pattern, to be able to use async plus await everywhere and
 * properly handle errors.
 */
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
exports.main = main;
