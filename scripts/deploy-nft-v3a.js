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
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  const deadline = 126_230_400; // 4 years
  // addresses XPower[New]
  const thor_xpower = process.env.THOR_MOE_V3a;
  assert(thor_xpower, "missing THOR_MOE_V3a");
  const loki_xpower = process.env.LOKI_MOE_V3a;
  assert(loki_xpower, "missing LOKI_MOE_V3a");
  const odin_xpower = process.env.ODIN_MOE_V3a;
  assert(odin_xpower, "missing ODIN_MOE_V3a");
  // addresses XPowerNft[Uri]
  const thor_uri = process.env.THOR_NFT_URI;
  assert(thor_uri, "missing THOR_NFT_URI");
  const loki_uri = process.env.LOKI_NFT_URI;
  assert(loki_uri, "missing LOKI_NFT_URI");
  const odin_uri = process.env.ODIN_NFT_URI;
  assert(odin_uri, "missing ODIN_NFT_URI");
  // addresses XPowerNft[Old]
  const thor_base = process.env.THOR_NFT_V2a;
  assert(thor_base, "missing THOR_NFT_V2a");
  const loki_base = process.env.LOKI_NFT_V2a;
  assert(loki_base, "missing LOKI_NFT_V2a");
  const odin_base = process.env.ODIN_NFT_V2a;
  assert(odin_base, "missing ODIN_NFT_V2a");
  //
  // deploy XPowerThorNft[New]:
  //
  const thor_nft = await deploy("XPowerThorNft", {
    uri: thor_uri,
    base: thor_base,
    deadline,
    moe: thor_xpower,
    owner,
  });
  console.log(`THOR_NFT_V3a=${thor_nft.address}`);
  //
  // deploy XPowerLokiNft[New]:
  //
  const loki_nft = await deploy("XPowerLokiNft", {
    uri: loki_uri,
    base: loki_base,
    deadline,
    moe: loki_xpower,
    owner,
  });
  console.log(`LOKI_NFT_V3a=${loki_nft.address}`);
  //
  // deploy XPowerOdinNft[New]:
  //
  const odin_nft = await deploy("XPowerOdinNft", {
    uri: odin_uri,
    base: odin_base,
    deadline,
    moe: odin_xpower,
    owner,
  });
  console.log(`ODIN_NFT_V3a=${odin_nft.address}`);
}
async function deploy(name, { uri, base, deadline, moe, owner }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(uri, base, deadline, moe);
  await wait(contract.deployTransaction);
  const transfer = await contract.transferOwnership(owner);
  await wait(transfer);
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
