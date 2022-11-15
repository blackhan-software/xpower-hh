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
  const none = process.env.NONE_ADDRESS;
  assert(none, "missing NONE_ADDRESS");
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  // addresses XPower[New]
  const thor_moe_link = process.env.THOR_MOE_V2a;
  assert(thor_moe_link, "missing THOR_MOE_V2a");
  const loki_moe_link = process.env.LOKI_MOE_V2a;
  assert(loki_moe_link, "missing LOKI_MOE_V2a");
  const odin_moe_link = process.env.ODIN_MOE_V2a;
  assert(odin_moe_link, "missing ODIN_MOE_V2a");
  // addresses XPowerNft[Uri]
  const thor_nft_uri = process.env.THOR_NFT_URI;
  assert(thor_nft_uri, "missing THOR_NFT_URI");
  const loki_nft_uri = process.env.LOKI_NFT_URI;
  assert(loki_nft_uri, "missing LOKI_NFT_URI");
  const odin_nft_uri = process.env.ODIN_NFT_URI;
  assert(odin_nft_uri, "missing ODIN_NFT_URI");
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy XPowerThorNft[Old]:
  //
  const thor_nft = await deploy("XPowerThorNft", {
    nft_uri: thor_nft_uri,
    moe_link: thor_moe_link,
    nft_base: none,
    deadline,
    owner,
  });
  console.log(`THOR_NFT_V2a=${thor_nft.address}`);
  //
  // deploy XPowerLokiNft[Old]:
  //
  const loki_nft = await deploy("XPowerLokiNft", {
    nft_uri: loki_nft_uri,
    moe_link: loki_moe_link,
    nft_base: none,
    deadline,
    owner,
  });
  console.log(`LOKI_NFT_V2a=${loki_nft.address}`);
  //
  // deploy XPowerOdinNft[Old]:
  //
  const odin_nft = await deploy("XPowerOdinNft", {
    nft_uri: odin_nft_uri,
    moe_link: odin_moe_link,
    nft_base: none,
    deadline,
    owner,
  });
  console.log(`ODIN_NFT_V2a=${odin_nft.address}`);
}
async function deploy(name, { nft_uri, moe_link, nft_base, deadline, owner }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(nft_uri, moe_link, nft_base, deadline);
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
