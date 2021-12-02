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
  const own_address = process.env.OWNER_ADDRESS;
  assert(own_address, "missing OWNER_ADDRESS");
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
  assert(cpu_nft_address_v1, "missing XPOWER_NFT_ADDRESS_CPU_OLD_V1");
  const gpu_nft_address_v1 = process.env.XPOWER_NFT_ADDRESS_GPU_V1;
  assert(gpu_nft_address_v1, "missing XPOWER_NFT_ADDRESS_GPU_OLD_V1");
  const asc_nft_address_v1 = process.env.XPOWER_NFT_ADDRESS_ASC_V1;
  assert(asc_nft_address_v1, "missing XPOWER_NFT_ADDRESS_ASC_OLD_V1");
  //
  // deploy XPowerCpuNft[New]:
  //
  const v2_cpu_factory = await hre.ethers.getContractFactory("XPowerCpuNft");
  const v2_cpu = await v2_cpu_factory.deploy(
    cpu_nft_uri,
    cpu_address,
    cpu_nft_address_v1
  );
  await v2_cpu.deployed();
  console.log("[DEPLOY] XPowerNft CPU contract to:", v2_cpu.address);
  await v2_cpu.transferOwnership(own_address);
  //
  // deploy XPowerGpuNft[New]:
  //
  const v2_gpu_factory = await hre.ethers.getContractFactory("XPowerGpuNft");
  const v2_gpu = await v2_gpu_factory.deploy(
    gpu_nft_uri,
    gpu_address,
    gpu_nft_address_v1
  );
  await v2_gpu.deployed();
  console.log("[DEPLOY] XPowerNft GPU contract to:", v2_gpu.address);
  await v2_gpu.transferOwnership(own_address);
  //
  // deploy XPowerAsicNft[New]:
  //
  const v2_asc_factory = await hre.ethers.getContractFactory("XPowerAsicNft");
  const v2_asc = await v2_asc_factory.deploy(
    asc_nft_uri,
    asc_address,
    asc_nft_address_v1
  );
  await v2_asc.deployed();
  console.log("[DEPLOY] XPowerNft ASC contract to:", v2_asc.address);
  await v2_asc.transferOwnership(own_address);
  //
  // show ownership address:
  //
  console.log("[DEPLOY] and with the ownership at:", own_address);
}

/**
 * We recommend this pattern, to be able to use async plus await everywhere and
 * properly handle errors.
 */
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
