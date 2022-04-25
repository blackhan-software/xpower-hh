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
  // addresses XPowerNft[New]
  const thor_nft = process.env.THOR_NFT_V4a;
  assert(thor_nft, "missing THOR_NFT_V4a");
  const loki_nft = process.env.LOKI_NFT_V4a;
  assert(loki_nft, "missing LOKI_NFT_V4a");
  const odin_nft = process.env.ODIN_NFT_V4a;
  assert(odin_nft, "missing ODIN_NFT_V4a");
  // addresses XPowerNftStaked[New]
  const thor_nft_staked = process.env.THOR_PPT_V4a;
  assert(thor_nft_staked, "missing THOR_PPT_V4a");
  const loki_nft_staked = process.env.LOKI_PPT_V4a;
  assert(loki_nft_staked, "missing LOKI_PPT_V4a");
  const odin_nft_staked = process.env.ODIN_PPT_V4a;
  assert(odin_nft_staked, "missing ODIN_PPT_V4a");
  //
  // deploy THOR NftTreasury[New]:
  //
  const thor_treasury = await deploy("NftTreasury", {
    nft: thor_nft,
    nft_staked: thor_nft_staked,
  });
  console.log(`THOR_PPT_TREASURY_V4a=${thor_treasury.address}`);
  await repossess("XPowerThorNftStaked", {
    nft_staked: thor_nft_staked,
    nft_treasury: thor_treasury.address,
  });
  //
  // deploy LOKI NftTreasury[New]:
  //
  const loki_treasury = await deploy("NftTreasury", {
    nft: loki_nft,
    nft_staked: loki_nft_staked,
  });
  console.log(`LOKI_PPT_TREASURY_V4a=${loki_treasury.address}`);
  await repossess("XPowerLokiNftStaked", {
    nft_staked: loki_nft_staked,
    nft_treasury: loki_treasury.address,
  });
  //
  // deploy ODIN NftTreasury[New]:
  //
  const odin_treasury = await deploy("NftTreasury", {
    nft: odin_nft,
    nft_staked: odin_nft_staked,
  });
  console.log(`ODIN_PPT_TREASURY_V4a=${odin_treasury.address}`);
  await repossess("XPowerOdinNftStaked", {
    nft_staked: odin_nft_staked,
    nft_treasury: odin_treasury.address,
  });
}
async function deploy(name, { nft, nft_staked }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(nft, nft_staked);
  await wait(contract.deployTransaction);
  return contract;
}
async function repossess(name, { nft_staked, nft_treasury }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = factory.attach(nft_staked);
  const transfer = await contract.transferOwnership(nft_treasury);
  await wait(transfer);
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
