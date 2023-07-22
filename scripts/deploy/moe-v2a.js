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
 * @returns list of base contract addresses
 */
function moe_bases(token, versions = []) {
  return versions.map((version) => {
    const moe_base = process.env[`${token}_MOE_${version}`];
    assert(moe_base, `missing ${token}_MOE_${version}`);
    return moe_base;
  });
}
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
  const xpow_moe_base = moe_bases("XPOW");
  assert(xpow_moe_base.length === 0);
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy XPower[Old]
  //
  const { moe } = await deploy("XPower", {
    moe_base: xpow_moe_base,
    deadline,
    owner,
  });
  console.log(`XPOW_MOE_V2a=${moe.target}`);
}
async function deploy(name, { moe_base, deadline, owner }) {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.deploy(moe_base, deadline);
  await wait(contract);
  const transfer = await contract.transferOwnership(owner);
  await wait(transfer);
  return { moe: contract };
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
