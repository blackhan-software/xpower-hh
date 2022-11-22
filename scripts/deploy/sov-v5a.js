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
  const none = process.env.NONE_ADDRESS;
  assert(none, "missing NONE_ADDRESS");
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  // addresses XPower[New]
  const thor_moe_link = process.env.THOR_MOE_V5a;
  assert(thor_moe_link, "missing THOR_MOE_V5a");
  const loki_moe_link = process.env.LOKI_MOE_V5a;
  assert(loki_moe_link, "missing LOKI_MOE_V5a");
  const odin_moe_link = process.env.ODIN_MOE_V5a;
  assert(odin_moe_link, "missing ODIN_MOE_V5a");
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy APowerThor[New]
  //
  const thor_sov = await deploy("APowerThor", {
    moe_link: thor_moe_link,
    sov_base: none,
    deadline,
  });
  console.log(`THOR_SOV_V5a=${thor_sov.address}`);
  //
  // deploy APowerLoki[New]
  //
  const loki_sov = await deploy("APowerLoki", {
    moe_link: loki_moe_link,
    sov_base: none,
    deadline,
  });
  console.log(`LOKI_SOV_V5a=${loki_sov.address}`);
  //
  // deploy APowerOdin[New]
  //
  const odin_sov = await deploy("APowerOdin", {
    moe_link: odin_moe_link,
    sov_base: none,
    deadline,
  });
  console.log(`ODIN_SOV_V5a=${odin_sov.address}`);
}
async function deploy(name, { moe_link, sov_base, deadline }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(moe_link, sov_base, deadline);
  await wait(contract.deployTransaction);
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