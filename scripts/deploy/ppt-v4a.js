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
 * > await hre.run('compile');
 */
async function main() {
  // addresses XPowerNft[Uri]
  const thor_ppt_uri = process.env.THOR_PPT_URI;
  assert(thor_ppt_uri, "missing THOR_PPT_URI");
  const loki_ppt_uri = process.env.LOKI_PPT_URI;
  assert(loki_ppt_uri, "missing LOKI_PPT_URI");
  const odin_ppt_uri = process.env.ODIN_PPT_URI;
  assert(odin_ppt_uri, "missing ODIN_PPT_URI");
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy XPowerThorNft[New]:
  //
  const thor_nft = await deploy("XPowerThorNftStaked", {
    ppt_uri: thor_ppt_uri,
    ppt_base: [],
    deadline,
  });
  console.log(`THOR_PPT_V4a=${thor_nft.address}`);
  //
  // deploy XPowerLokiNft[New]:
  //
  const loki_nft = await deploy("XPowerLokiNftStaked", {
    ppt_uri: loki_ppt_uri,
    ppt_base: [],
    deadline,
  });
  console.log(`LOKI_PPT_V4a=${loki_nft.address}`);
  //
  // deploy XPowerOdinNft[New]:
  //
  const odin_nft = await deploy("XPowerOdinNftStaked", {
    ppt_uri: odin_ppt_uri,
    ppt_base: [],
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
