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
const { wait } = require("../wait");

/**
 * Hardhat *always* runs the compile task when running scripts with its command
 * line interface. But, if this script is run *directly* using `node`, then you
 * may want to call compile manually to make sure everything is compiled:
 *
 * > await hre.run("compile");
 */
async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  // addresses XPower[Old]
  const thor_moe_base = process.env.THOR_MOE_V3a;
  assert(thor_moe_base, "missing THOR_MOE_V3a");
  const loki_moe_base = process.env.LOKI_MOE_V3a;
  assert(loki_moe_base, "missing LOKI_MOE_V3a");
  const odin_moe_base = process.env.ODIN_MOE_V3a;
  assert(odin_moe_base, "missing ODIN_MOE_V3a");
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy XPowerThor[New]
  //
  const thor_moe = await deploy("XPowerThor", {
    moe_base: thor_moe_base,
    deadline,
    owner,
  });
  console.log(`THOR_MOE_V4a=${thor_moe.address}`);
  //
  // deploy XPowerLoki[New]
  //
  const loki_moe = await deploy("XPowerLoki", {
    moe_base: loki_moe_base,
    deadline,
    owner,
  });
  console.log(`LOKI_MOE_V4a=${loki_moe.address}`);
  //
  // deploy XPowerOdin[New]
  //
  const odin_moe = await deploy("XPowerOdin", {
    moe_base: odin_moe_base,
    deadline,
    owner,
  });
  console.log(`ODIN_MOE_V4a=${odin_moe.address}`);
}
async function deploy(name, { moe_base, deadline, owner }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(moe_base, deadline);
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