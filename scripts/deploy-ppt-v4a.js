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
  const para_uri = process.env.PARA_PPT_URI;
  assert(para_uri, "missing PARA_PPT_URI");
  const aqch_uri = process.env.AQCH_PPT_URI;
  assert(aqch_uri, "missing AQCH_PPT_URI");
  const qrsh_uri = process.env.QRSH_PPT_URI;
  assert(qrsh_uri, "missing QRSH_PPT_URI");
  //
  // deploy XPowerParaNft[New]:
  //
  const para_nft = await deploy("XPowerParaNftStaked", {
    uri: para_uri,
    base: none,
    deadline,
  });
  console.log(`PARA_PPT_V4a=${para_nft.address}`);
  //
  // deploy XPowerAqchNft[New]:
  //
  const aqch_nft = await deploy("XPowerAqchNftStaked", {
    uri: aqch_uri,
    base: none,
    deadline,
  });
  console.log(`AQCH_PPT_V4a=${aqch_nft.address}`);
  //
  // deploy XPowerQrshNft[New]:
  //
  const qrsh_nft = await deploy("XPowerQrshNftStaked", {
    uri: qrsh_uri,
    base: none,
    deadline,
  });
  console.log(`QRSH_PPT_V4a=${qrsh_nft.address}`);
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
