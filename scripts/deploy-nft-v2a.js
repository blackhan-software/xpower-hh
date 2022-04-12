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
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  const deadline = 126_230_400; // 4 years
  // addresses XPower[Old]
  const para_xpower = process.env.PARA_MOE_V2a;
  assert(para_xpower, "missing PARA_MOE_V2a");
  const aqch_xpower = process.env.AQCH_MOE_V2a;
  assert(aqch_xpower, "missing AQCH_MOE_V2a");
  const qrsh_xpower = process.env.QRSH_MOE_V2a;
  assert(qrsh_xpower, "missing QRSH_MOE_V2a");
  // addresses XPowerNft[Uri]
  const para_uri = process.env.PARA_NFT_URI;
  assert(para_uri, "missing PARA_NFT_URI");
  const aqch_uri = process.env.AQCH_NFT_URI;
  assert(aqch_uri, "missing AQCH_NFT_URI");
  const qrsh_uri = process.env.QRSH_NFT_URI;
  assert(qrsh_uri, "missing QRSH_NFT_URI");
  //
  // deploy XPowerParaNft[Old]:
  //
  const para_nft = await deploy("XPowerParaNft", {
    uri: para_uri,
    base: none,
    deadline,
    moe: para_xpower,
    owner,
  });
  console.log(`PARA_NFT_V2a=${para_nft.address}`);
  //
  // deploy XPowerAqchNft[Old]:
  //
  const aqch_nft = await deploy("XPowerAqchNft", {
    uri: aqch_uri,
    base: none,
    deadline,
    moe: aqch_xpower,
    owner,
  });
  console.log(`AQCH_NFT_V2a=${aqch_nft.address}`);
  //
  // deploy XPowerQrshNft[Old]:
  //
  const qrsh_nft = await deploy("XPowerQrshNft", {
    uri: qrsh_uri,
    base: none,
    deadline,
    moe: qrsh_xpower,
    owner,
  });
  console.log(`QRSH_NFT_V2a=${qrsh_nft.address}`);
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
