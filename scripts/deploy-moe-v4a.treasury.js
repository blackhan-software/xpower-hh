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
  const para_moe = process.env.PARA_MOE_V4a;
  assert(para_moe, "missing PARA_MOE_V4a");
  const aqch_moe = process.env.AQCH_MOE_V4a;
  assert(aqch_moe, "missing AQCH_MOE_V4a");
  const qrsh_moe = process.env.QRSH_MOE_V4a;
  assert(qrsh_moe, "missing QRSH_MOE_V4a");
  // addresses XPowerNftStaked[New]
  const para_nft_staked = process.env.PARA_PPT_V4a;
  assert(para_nft_staked, "missing PARA_PPT_V4a");
  const aqch_nft_staked = process.env.AQCH_PPT_V4a;
  assert(aqch_nft_staked, "missing AQCH_PPT_V4a");
  const qrsh_nft_staked = process.env.QRSH_PPT_V4a;
  assert(qrsh_nft_staked, "missing QRSH_PPT_V4a");
  //
  // deploy PARA NftTreasury[New]:
  //
  const para_treasury = await deploy("MoeTreasury", {
    moe: para_moe,
    nft_staked: para_nft_staked,
    owner,
  });
  console.log(`PARA_MOE_TREASURY_V4a=${para_treasury.address}`);
  //
  // deploy AQCH NftTreasury[New]:
  //
  const aqch_treasury = await deploy("MoeTreasury", {
    moe: aqch_moe,
    nft_staked: aqch_nft_staked,
    owner,
  });
  console.log(`AQCH_MOE_TREASURY_V4a=${aqch_treasury.address}`);
  //
  // deploy QRSH NftTreasury[New]:
  //
  const qrsh_treasury = await deploy("MoeTreasury", {
    moe: qrsh_moe,
    nft_staked: qrsh_nft_staked,
    owner,
  });
  console.log(`QRSH_MOE_TREASURY_V4a=${qrsh_treasury.address}`);
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
