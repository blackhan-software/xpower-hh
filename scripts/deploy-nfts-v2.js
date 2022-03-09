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
  const none = process.env.XPOWER_ADDRESS_NONE;
  assert(none, "missing XPOWER_ADDRESS_NONE");
  const owner = process.env.OWNER_ADDRESS;
  assert(owner, "missing OWNER_ADDRESS");
  // addresses XPower[Old]
  const para_xpower = process.env.XPOWER_ADDRESS_PARA_V2;
  assert(para_xpower, "missing XPOWER_ADDRESS_PARA_V2");
  const aqch_xpower = process.env.XPOWER_ADDRESS_AQCH_V2;
  assert(aqch_xpower, "missing XPOWER_ADDRESS_AQCH_V2");
  const qrsh_xpower = process.env.XPOWER_ADDRESS_QRSH_V2;
  assert(qrsh_xpower, "missing XPOWER_ADDRESS_QRSH_V2");
  // addresses XPowerNft[Uri]
  const para_uri = process.env.XPOWER_NFT_URI_PARA;
  assert(para_uri, "missing XPOWER_NFT_URI_PARA");
  const aqch_uri = process.env.XPOWER_NFT_URI_AQCH;
  assert(aqch_uri, "missing XPOWER_NFT_URI_AQCH");
  const qrsh_uri = process.env.XPOWER_NFT_URI_QRSH;
  assert(qrsh_uri, "missing XPOWER_NFT_URI_QRSH");
  //
  // deploy XPowerParaNft[Old]:
  //
  const para = await deploy("XPowerParaNft", {
    base: none,
    uri: para_uri,
    xpower: para_xpower,
    owner,
  });
  console.log(`XPOWER_NFT_ADDRESS_PARA_V2=${para.address}`);
  //
  // deploy XPowerAqchNft[Old]:
  //
  const aqch = await deploy("XPowerAqchNft", {
    base: none,
    uri: aqch_uri,
    xpower: aqch_xpower,
    owner,
  });
  console.log(`XPOWER_NFT_ADDRESS_AQCH_V2=${aqch.address}`);
  //
  // deploy XPowerQrshNft[Old]:
  //
  const qrsh = await deploy("XPowerQrshNft", {
    base: none,
    uri: qrsh_uri,
    xpower: qrsh_xpower,
    owner,
  });
  console.log(`XPOWER_NFT_ADDRESS_QRSH_V2=${qrsh.address}`);
}
async function deploy(name, { base, uri, xpower, owner }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(uri, xpower, base);
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
