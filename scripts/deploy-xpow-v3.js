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
  const para_base = process.env.XPOWER_ADDRESS_PARA_V2;
  assert(para_base, "missing XPOWER_ADDRESS_PARA_V2");
  const aqch_base = process.env.XPOWER_ADDRESS_AQCH_V2;
  assert(aqch_base, "missing XPOWER_ADDRESS_AQCH_V2");
  const qrsh_base = process.env.XPOWER_ADDRESS_QRSH_V2;
  assert(qrsh_base, "missing XPOWER_ADDRESS_QRSH_V2");
  const owner = process.env.OWNER_ADDRESS;
  assert(owner, "missing OWNER_ADDRESS");
  const deadline = 126_230_400; // in seconds i.e. 4 years
  //
  // deploy XPowerPara[New]
  //
  const para = await deploy("XPowerPara", {
    base: para_base,
    deadline,
    owner,
  });
  console.log(`XPOWER_ADDRESS_PARA_V3=${para.address}`);
  //
  // deploy XPowerAqch[New]
  //
  const aqch = await deploy("XPowerAqch", {
    base: aqch_base,
    deadline,
    owner,
  });
  console.log(`XPOWER_ADDRESS_AQCH_V3=${aqch.address}`);
  //
  // deploy XPowerQrsh[New]
  //
  const qrsh = await deploy("XPowerQrsh", {
    base: qrsh_base,
    deadline,
    owner,
  });
  console.log(`XPOWER_ADDRESS_QRSH_V3=${qrsh.address}`);
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
