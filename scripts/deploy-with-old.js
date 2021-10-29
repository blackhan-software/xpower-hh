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
  const owner_address = process.env.OWNER_ADDRESS;
  assert(owner_address, "missing OWNER_ADDRESS");
  const deadline = 1_814_400; // in seconds, i.e. 3 weeks
  //
  // deploy XPOW-OLD: sealed => *not* migratable from nil address
  //
  const factory_old = await hre.ethers.getContractFactory("XPowerGpu");
  const xpower_old = await factory_old.deploy(nil_address, deadline);
  await xpower_old.deployed();
  await xpower_old.seal();
  console.log("[DEPLOY] XPower OLD contract to:", xpower_old.address);
  await xpower_old.transferOwnership(owner_address);
  //
  // deploy XPOW-CPU: sealed => *not* migratable from old address
  //
  const factory_cpu = await hre.ethers.getContractFactory("XPowerCpu");
  const xpower_cpu = await factory_cpu.deploy(xpower_old.address, deadline);
  await xpower_cpu.deployed();
  await xpower_cpu.seal();
  console.log("[DEPLOY] XPower CPU contract to:", xpower_cpu.address);
  await xpower_cpu.transferOwnership(owner_address);
  //
  // deploy XPOW-GPU: *not* sealed => migratable from old address
  //
  const factory_gpu = await hre.ethers.getContractFactory("XPowerGpu");
  const xpower_gpu = await factory_gpu.deploy(xpower_old.address, deadline);
  await xpower_gpu.deployed();
  console.log("[DEPLOY] XPower GPU contract to:", xpower_gpu.address);
  await xpower_gpu.transferOwnership(owner_address);
  //
  // deploy XPOW-ASIC: sealed => *not* migratable from old address
  //
  const factory_asc = await hre.ethers.getContractFactory("XPowerAsic");
  const xpower_asc = await factory_asc.deploy(xpower_old.address, deadline);
  await xpower_asc.deployed();
  await xpower_asc.seal();
  console.log("[DEPLOY] XPower ASC contract to:", xpower_asc.address);
  await xpower_asc.transferOwnership(owner_address);
  console.log("[DEPLOY] and w/the ownership at:", owner_address);
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
