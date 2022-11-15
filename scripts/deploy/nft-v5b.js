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
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  // addresses XPowerNft[Old]
  const thor_nft_base = process.env.THOR_NFT_V5a;
  assert(thor_nft_base, "missing THOR_NFT_V5a");
  const loki_nft_base = process.env.LOKI_NFT_V5a;
  assert(loki_nft_base, "missing LOKI_NFT_V5a");
  const odin_nft_base = process.env.ODIN_NFT_V5a;
  assert(odin_nft_base, "missing ODIN_NFT_V5a");
  // addresses XPower[New]
  const thor_moe_link = process.env.THOR_MOE_V5b;
  assert(thor_moe_link, "missing THOR_MOE_V5b");
  const loki_moe_link = process.env.LOKI_MOE_V5b;
  assert(loki_moe_link, "missing LOKI_MOE_V5b");
  const odin_moe_link = process.env.ODIN_MOE_V5b;
  assert(odin_moe_link, "missing ODIN_MOE_V5b");
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
  // deploy XPowerThorNft[New]:
  //
  const thor_nft = await deploy("XPowerThorNft", {
    nft_uri: thor_nft_uri,
    moe_link: thor_moe_link,
    nft_base: thor_nft_base,
    deadline,
    owner,
  });
  console.log(`THOR_NFT_V5b=${thor_nft.address}`);
  //
  // deploy XPowerLokiNft[New]:
  //
  const loki_nft = await deploy("XPowerLokiNft", {
    nft_uri: loki_nft_uri,
    moe_link: loki_moe_link,
    nft_base: loki_nft_base,
    deadline,
    owner,
  });
  console.log(`LOKI_NFT_V5b=${loki_nft.address}`);
  //
  // deploy XPowerOdinNft[New]:
  //
  const odin_nft = await deploy("XPowerOdinNft", {
    nft_uri: odin_nft_uri,
    moe_link: odin_moe_link,
    nft_base: odin_nft_base,
    deadline,
    owner,
  });
  console.log(`ODIN_NFT_V5b=${odin_nft.address}`);
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
