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
 * > await hre.run("compile");
 */
async function main() {
  const none = process.env.XPOWER_ADDRESS_NONE;
  assert(none, "missing XPOWER_ADDRESS_NONE");
  const owner = process.env.OWNER_ADDRESS;
  assert(owner, "missing OWNER_ADDRESS");
  const deadline = 126_230_400; // in seconds i.e. 4 years
  //
  // deploy XPowerPara[Old]
  //
  const para = await deploy("XPowerPara", {
    base: none,
    deadline,
    owner,
  });
  console.log(`XPOWER_ADDRESS_PARA_V2=${para.address}`);
  //
  // deploy XPowerAqch[Old]
  //
  const aqch = await deploy("XPowerAqch", {
    base: none,
    deadline,
    owner,
  });
  console.log(`XPOWER_ADDRESS_AQCH_V2=${aqch.address}`);
  //
  // deploy XPowerQrsh[Old]
  //
  const qrsh = await deploy("XPowerQrsh", {
    base: none,
    deadline,
    owner,
  });
  console.log(`XPOWER_ADDRESS_QRSH_V2=${qrsh.address}`);
}
async function deploy(name, { base, deadline, owner }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(base, deadline);
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
