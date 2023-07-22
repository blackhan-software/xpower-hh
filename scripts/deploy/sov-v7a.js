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
function sov_bases(
  token,
  versions = ["V5a", "V5b", "V5c", "V6a", "V6b", "V6c"],
) {
  return versions.map((version) => {
    const moe_base = process.env[`${token}_SOV_${version}`];
    assert(moe_base, `missing ${token}_SOV_${version}`);
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
  // addresses APower[Old]
  const xpow_sov_base = sov_bases("XPOW");
  assert(xpow_sov_base.length === 6);
  // addresses XPower[New]
  const xpow_moe_link = process.env.XPOW_MOE_V7a;
  assert(xpow_moe_link, "missing XPOW_MOE_V7a");
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy APower[New]
  //
  const { sov } = await deploy("APower", {
    moe_link: xpow_moe_link,
    sov_base: xpow_sov_base,
    deadline,
  });
  console.log(`XPOW_SOV_V7a=${sov.target}`);
  //
  // verify contract(s):
  //
  await verify("APower", sov, xpow_moe_link, xpow_sov_base, deadline);
}
async function deploy(name, { moe_link, sov_base, deadline }) {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.deploy(moe_link, sov_base, deadline);
  await wait(contract);
  return { sov: contract };
}
async function verify(name, { target }, ...args) {
  if (hre.network.name.match(/mainnet|fuji/)) {
    return await hre.run("verify:verify", {
      address: target,
      contract: `contracts/APower.sol:${name}`,
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
