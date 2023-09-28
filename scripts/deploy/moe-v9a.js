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
const { ethers } = require("hardhat");

/**
 * @returns list of base contract addresses
 */
function moe_bases(
  token,
  versions = [
    "V1a",
    "V2a",
    "V3a",
    "V4a",
    "V5a",
    "V5b",
    "V5c",
    "V6a",
    "V6b",
    "V6c",
    "V7a",
    "V7b",
    "V7c",
    "V8a",
    "V8b",
    "V8c",
  ],
) {
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
  // addresses XPower[Old]
  const moe_base = moe_bases("XPOW");
  assert(moe_base.length === 16);
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy XPower[New]
  //
  const { moe } = await deploy("XPower", {
    moe_base,
    deadline,
  });
  console.log(`XPOW_MOE_V9a=${moe.target}`);
  //
  // verify contract(s):
  //
  await verify("XPower", moe, moe_base, deadline);
}
async function deploy(name, { moe_base, deadline }) {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.deploy(moe_base, deadline);
  await wait(contract);
  return { moe: contract };
}
async function verify(name, { target }, ...args) {
  if (hre.network.name.match(/mainnet|fuji/)) {
    return await hre.run("verify:verify", {
      address: target,
      contract: `contracts/XPower.sol:${name}`,
      constructorArguments: args,
    });
  }
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
