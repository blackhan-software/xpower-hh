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
  const owner_address = process.env.OWNER_ADDRESS;
  assert(owner_address, "missing OWNER_ADDRESS");
  const factory = await hre.ethers.getContractFactory("XPower");
  const xpower = await factory.deploy();
  await xpower.deployed();
  console.log("[DEPLOY] XPower contract to:", xpower.address);
  await xpower.transferOwnership(owner_address);
  console.log("[DEPLOY] w/the ownership of:", owner_address);
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
