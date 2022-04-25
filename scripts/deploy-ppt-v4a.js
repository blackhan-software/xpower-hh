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
const { wait } = require("./wait");

/**
 * Hardhat *always* runs the compile task when running scripts with its command
 * line interface. But, if this script is run *directly* using `node`, then you
 * may want to call compile manually to make sure everything is compiled:
 *
 * > await hre.run('compile');
 */
async function main() {
  const none = process.env.NONE_ADDRESS;
  assert(none, "missing NONE_ADDRESS");
  const deadline = 126_230_400; // 4 years
  // addresses XPowerNft[Uri]
  const thor_uri = process.env.THOR_PPT_URI;
  assert(thor_uri, "missing THOR_PPT_URI");
  const loki_uri = process.env.LOKI_PPT_URI;
  assert(loki_uri, "missing LOKI_PPT_URI");
  const odin_uri = process.env.ODIN_PPT_URI;
  assert(odin_uri, "missing ODIN_PPT_URI");
  //
  // deploy XPowerThorNft[New]:
  //
  const thor_nft = await deploy("XPowerThorNftStaked", {
    uri: thor_uri,
    base: none,
    deadline,
  });
  console.log(`THOR_PPT_V4a=${thor_nft.address}`);
  //
  // deploy XPowerLokiNft[New]:
  //
  const loki_nft = await deploy("XPowerLokiNftStaked", {
    uri: loki_uri,
    base: none,
    deadline,
  });
  console.log(`LOKI_PPT_V4a=${loki_nft.address}`);
  //
  // deploy XPowerOdinNft[New]:
  //
  const odin_nft = await deploy("XPowerOdinNftStaked", {
    uri: odin_uri,
    base: none,
    deadline,
  });
  console.log(`ODIN_PPT_V4a=${odin_nft.address}`);
}
async function deploy(name, { uri, base, deadline }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(uri, base, deadline);
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
