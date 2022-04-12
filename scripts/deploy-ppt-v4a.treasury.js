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
  const para_nft = process.env.PARA_NFT_V4a;
  assert(para_nft, "missing PARA_NFT_V4a");
  const aqch_nft = process.env.AQCH_NFT_V4a;
  assert(aqch_nft, "missing AQCH_NFT_V4a");
  const qrsh_nft = process.env.QRSH_NFT_V4a;
  assert(qrsh_nft, "missing QRSH_NFT_V4a");
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
  const para_treasury = await deploy("NftTreasury", {
    nft: para_nft,
    nft_staked: para_nft_staked,
  });
  console.log(`PARA_PPT_TREASURY_V4a=${para_treasury.address}`);
  await repossess("XPowerParaNftStaked", {
    nft_staked: para_nft_staked,
    nft_treasury: para_treasury.address,
  });
  //
  // deploy AQCH NftTreasury[New]:
  //
  const aqch_treasury = await deploy("NftTreasury", {
    nft: aqch_nft,
    nft_staked: aqch_nft_staked,
  });
  console.log(`AQCH_PPT_TREASURY_V4a=${aqch_treasury.address}`);
  await repossess("XPowerAqchNftStaked", {
    nft_staked: aqch_nft_staked,
    nft_treasury: aqch_treasury.address,
  });
  //
  // deploy QRSH NftTreasury[New]:
  //
  const qrsh_treasury = await deploy("NftTreasury", {
    nft: qrsh_nft,
    nft_staked: qrsh_nft_staked,
  });
  console.log(`QRSH_PPT_TREASURY_V4a=${qrsh_treasury.address}`);
  await repossess("XPowerQrshNftStaked", {
    nft_staked: qrsh_nft_staked,
    nft_treasury: qrsh_treasury.address,
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
