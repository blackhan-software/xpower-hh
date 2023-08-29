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
function ppt_bases(token, versions = []) {
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
  // addresses XPowerPpt[Old]
  const ppt_base = ppt_bases("XPOW");
  assert(ppt_base.length === 0);
  // addresses XPowerNft[Uri]
  const ppt_uri = process.env.XPOW_PPT_URI;
  assert(ppt_uri, "missing XPOW_PPT_URI");
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy XPowerNft[New]:
  //
  const { ppt } = await deploy("XPowerPpt", {
    ppt_uri,
    ppt_base,
    deadline,
  });
  console.log(`XPOW_PPT_V4a=${ppt.target}`);
}
async function deploy(name, { ppt_uri, ppt_base, deadline }) {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.deploy(ppt_uri, ppt_base, deadline);
  await wait(contract);
  return { ppt: contract };
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
