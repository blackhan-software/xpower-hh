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
  const own_address = process.env.OWNER_ADDRESS;
  assert(own_address, "missing OWNER_ADDRESS");
  const deadline = 1_814_400; // in seconds, i.e. 3 weeks
  //
  // deploy XPower[Old]: sealed => *not* migratable from nil address
  //
  const old_factory = await hre.ethers.getContractFactory("XPowerGpu");
  const old = await old_factory.deploy(nil_address, deadline);
  await old.deployed();
  await old.seal();
  console.log("[DEPLOY] XPower OLD contract to:", old.address);
  await old.transferOwnership(own_address);
  //
  // deploy XPowerCpu: sealed => *not* migratable from old address
  //
  const cpu_factory = await hre.ethers.getContractFactory("XPowerCpu");
  const cpu = await cpu_factory.deploy(old.address, deadline);
  await cpu.deployed();
  await cpu.seal();
  console.log("[DEPLOY] XPower CPU contract to:", cpu.address);
  await cpu.transferOwnership(own_address);
  //
  // deploy XPowerGpu: *not* sealed => migratable from old address
  //
  const gpu_factory = await hre.ethers.getContractFactory("XPowerGpu");
  const gpu = await gpu_factory.deploy(old.address, deadline);
  await gpu.deployed();
  await gpu.seal();
  console.log("[DEPLOY] XPower GPU contract to:", gpu.address);
  await gpu.transferOwnership(own_address);
  //
  // deploy XPowerAsic: sealed => *not* migratable from old address
  //
  const asc_factory = await hre.ethers.getContractFactory("XPowerAsic");
  const asc = await asc_factory.deploy(old.address, deadline);
  await asc.deployed();
  await asc.seal();
  console.log("[DEPLOY] XPower ASC contract to:", asc.address);
  await asc.transferOwnership(own_address);
  //
  // show ownership address:
  //
  console.log("[DEPLOY] and w/the ownership at:", own_address);
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
