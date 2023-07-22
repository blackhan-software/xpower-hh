/**
 * We require the Hardhat Runtime Environment (HRE) explicitly here: The import
 * is optional but useful for running a script in a standalone fashion through:
 *
 * $ node <script>
 *
 * When running the script via `npx hardhat run <script>` you'll find the HRE's
 * members available in the global scope.
 */
const assert = require("assert");
const { wait } = require("../wait");
const { ethers } = require("hardhat");

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
  // addresses APower[Old]
  const xpow_sov_base = process.env.XPOW_SOV_V5a;
  assert(xpow_sov_base, "missing XPOW_SOV_V5a");
  // addresses XPower[New]
  const xpow_moe_link = process.env.XPOW_MOE_V5b;
  assert(xpow_moe_link, "missing XPOW_MOE_V5b");
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy APower[New]
  //
  const { sov } = await deploy("APower", {
    moe_link: xpow_moe_link,
    sov_base: [xpow_sov_base],
    deadline,
  });
  console.log(`XPOW_SOV_V5b=${sov.target}`);
}
async function deploy(name, { moe_link, sov_base, deadline }) {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.deploy(moe_link, sov_base, deadline);
  await wait(contract);
  return { sov: contract };
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
