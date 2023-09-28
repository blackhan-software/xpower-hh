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
function ppt_bases(
  token,
  versions = [
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
    const ppt_base = process.env[`${token}_PPT_${version}`];
    assert(ppt_base, `missing ${token}_PPT_${version}`);
    return ppt_base;
  });
}
/**
 * Hardhat *always* runs the compile task when running scripts with its command
 * line interface. But, if this script is run *directly* using `node`, then you
 * may want to call compile manually to make sure everything is compiled:
 *
 * > await hre.run('compile');
 */
async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  // addresses XPowerPpt[Old]
  const ppt_base = ppt_bases("XPOW");
  assert(ppt_base.length === 13);
  // addresses XPowerPpt[Uri]
  const ppt_uri = process.env.XPOW_PPT_URI;
  assert(ppt_uri, "missing XPOW_PPT_URI");
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy XPowerPpt[New]:
  //
  const { ppt } = await deploy("XPowerPpt", {
    ppt_uri,
    ppt_base,
    deadline,
  });
  console.log(`XPOW_PPT_V9a=${ppt.target}`);
  //
  // verify contract(s):
  //
  await verify("XPowerPpt", ppt, ppt_uri, ppt_base, deadline);
}
async function deploy(name, { ppt_uri, ppt_base, deadline }) {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.deploy(ppt_uri, ppt_base, deadline);
  await wait(contract);
  return { ppt: contract };
}
async function verify(name, { target }, ...args) {
  if (hre.network.name.match(/mainnet|fuji/)) {
    return await hre.run("verify:verify", {
      address: target,
      contract: `contracts/XPowerPpt.sol:${name}`,
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
