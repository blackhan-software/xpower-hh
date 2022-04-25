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
  // addresses XPower[New]
  const thor_moe = process.env.THOR_MOE_V4a;
  assert(thor_moe, "missing THOR_MOE_V4a");
  const loki_moe = process.env.LOKI_MOE_V4a;
  assert(loki_moe, "missing LOKI_MOE_V4a");
  const odin_moe = process.env.ODIN_MOE_V4a;
  assert(odin_moe, "missing ODIN_MOE_V4a");
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
  const thor_treasury = await deploy("MoeTreasury", {
    moe: thor_moe,
    nft_staked: thor_nft_staked,
    owner,
  });
  console.log(`THOR_MOE_TREASURY_V4a=${thor_treasury.address}`);
  //
  // deploy LOKI NftTreasury[New]:
  //
  const loki_treasury = await deploy("MoeTreasury", {
    moe: loki_moe,
    nft_staked: loki_nft_staked,
    owner,
  });
  console.log(`LOKI_MOE_TREASURY_V4a=${loki_treasury.address}`);
  //
  // deploy ODIN NftTreasury[New]:
  //
  const odin_treasury = await deploy("MoeTreasury", {
    moe: odin_moe,
    nft_staked: odin_nft_staked,
    owner,
  });
  console.log(`ODIN_MOE_TREASURY_V4a=${odin_treasury.address}`);
}
async function deploy(name, { moe, nft_staked, owner }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(moe, nft_staked);
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
