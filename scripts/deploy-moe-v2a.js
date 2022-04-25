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
const { wait } = require("./wait");

/**
 * Hardhat *always* runs the compile task when running scripts with its command
 * line interface. But, if this script is run *directly* using `node`, then you
 * may want to call compile manually to make sure everything is compiled:
 *
 * > await hre.run("compile");
 */
async function main() {
  const none = process.env.NONE_ADDRESS;
  assert(none, "missing NONE_ADDRESS");
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  const deadline = 126_230_400; // 4 years
  //
  // deploy XPowerThor[Old]
  //
  const thor_moe = await deploy("XPowerThor", {
    base: none,
    deadline,
    owner,
  });
  console.log(`THOR_MOE_V2a=${thor_moe.address}`);
  //
  // deploy XPowerLoki[Old]
  //
  const loki_moe = await deploy("XPowerLoki", {
    base: none,
    deadline,
    owner,
  });
  console.log(`LOKI_MOE_V2a=${loki_moe.address}`);
  //
  // deploy XPowerOdin[Old]
  //
  const odin_moe = await deploy("XPowerOdin", {
    base: none,
    deadline,
    owner,
  });
  console.log(`ODIN_MOE_V2a=${odin_moe.address}`);
}
async function deploy(name, { base, deadline, owner }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(base, deadline);
  await wait(contract.deployTransaction);
  const transfer = await contract.transferOwnership(owner);
  await wait(transfer);
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
