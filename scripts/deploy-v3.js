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
 * > await hre.run("compile");
 */
async function main() {
  const cpu_base = process.env.XPOWER_ADDRESS_CPU_V2;
  assert(cpu_base, "missing XPOWER_ADDRESS_CPU_V2");
  const gpu_base = process.env.XPOWER_ADDRESS_GPU_V2;
  assert(gpu_base, "missing XPOWER_ADDRESS_GPU_V2");
  const asc_base = process.env.XPOWER_ADDRESS_ASC_V2;
  assert(asc_base, "missing XPOWER_ADDRESS_ASC_V2");
  const owner = process.env.OWNER_ADDRESS;
  assert(owner, "missing OWNER_ADDRESS");
  const deadline = 126_230_400; // in seconds i.e. 4 years
  //
  // deploy XPowerCpu[New]
  //
  const new_cpu = await deploy("XPowerCpu", {
    base: cpu_base,
    deadline,
    owner,
  });
  console.log(`[DEPLOY] XPowerCpu[New] contract to:`, new_cpu.address);
  //
  // deploy XPowerGpu[New]
  //
  const new_gpu = await deploy("XPowerGpu", {
    base: gpu_base,
    deadline,
    owner,
  });
  console.log(`[DEPLOY] XPowerGpu[New] contract to:`, new_gpu.address);
  //
  // deploy XPowerAsc[New]
  //
  const new_asc = await deploy("XPowerAsic", {
    base: asc_base,
    deadline,
    owner,
  });
  console.log(`[DEPLOY] XPowerAsc[New] contract to:`, new_asc.address);
  //
  // show ownership address:
  //
  console.log("[DEPLOY] ... and w/the ownership at:", owner);
}
async function deploy(name, { base, deadline, owner }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(base, deadline);
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
