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
  const nil = process.env.XPOWER_ADDRESS_NIL;
  assert(nil, "missing XPOWER_ADDRESS_NIL");
  const owner = process.env.OWNER_ADDRESS;
  assert(owner, "missing OWNER_ADDRESS");
  const deadline = 126_230_400; // in seconds i.e. 4 years
  //
  // deploy XPowerCpu[Old]
  //
  const cpu = await deploy("XPowerCpu", {
    base: nil,
    deadline,
    owner,
  });
  console.log(`[DEPLOY] XPowerCpu[Old] contract to:`, cpu.address);
  //
  // deploy XPowerGpu[Old]
  //
  const gpu = await deploy("XPowerGpu", {
    base: nil,
    deadline,
    owner,
  });
  console.log(`[DEPLOY] XPowerGpu[Old] contract to:`, gpu.address);
  //
  // deploy XPowerAsc[Old]
  //
  const asc = await deploy("XPowerAsic", {
    base: nil,
    deadline,
    owner,
  });
  console.log(`[DEPLOY] XPowerAsc[Old] contract to:`, asc.address);
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
