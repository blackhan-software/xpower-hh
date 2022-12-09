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
  const thor_ppt_base = ppt_bases("THOR");
  assert(thor_ppt_base.length === 0);
  const loki_ppt_base = ppt_bases("LOKI");
  assert(loki_ppt_base.length === 0);
  const odin_ppt_base = ppt_bases("ODIN");
  assert(odin_ppt_base.length === 0);
  // addresses XPowerNft[Uri]
  const xpow_ppt_uri = process.env.XPOW_PPT_URI;
  assert(xpow_ppt_uri, "missing XPOW_PPT_URI");
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy XPowerNft[New]:
  //
  const thor_nft = await deploy("XPowerPpt", {
    ppt_uri: xpow_ppt_uri,
    ppt_base: thor_ppt_base,
    deadline,
  });
  console.log(`THOR_PPT_V4a=${thor_nft.address}`);
  //
  // deploy XPowerNft[New]:
  //
  const loki_nft = await deploy("XPowerPpt", {
    ppt_uri: xpow_ppt_uri,
    ppt_base: loki_ppt_base,
    deadline,
  });
  console.log(`LOKI_PPT_V4a=${loki_nft.address}`);
  //
  // deploy XPowerNft[New]:
  //
  const odin_nft = await deploy("XPowerPpt", {
    ppt_uri: xpow_ppt_uri,
    ppt_base: odin_ppt_base,
    deadline,
  });
  console.log(`ODIN_PPT_V4a=${odin_nft.address}`);
}
async function deploy(name, { ppt_uri, ppt_base, deadline }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(ppt_uri, ppt_base, deadline);
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
