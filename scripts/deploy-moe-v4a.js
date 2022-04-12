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
  const para_base = process.env.PARA_MOE_V3a;
  assert(para_base, "missing PARA_MOE_V3a");
  const aqch_base = process.env.AQCH_MOE_V3a;
  assert(aqch_base, "missing AQCH_MOE_V3a");
  const qrsh_base = process.env.QRSH_MOE_V3a;
  assert(qrsh_base, "missing QRSH_MOE_V3a");
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  const deadline = 126_230_400; // 4 years
  //
  // deploy XPowerPara[New]
  //
  const para_moe = await deploy("XPowerPara", {
    base: para_base,
    deadline,
    owner,
  });
  console.log(`PARA_MOE_V4a=${para_moe.address}`);
  //
  // deploy XPowerAqch[New]
  //
  const aqch_moe = await deploy("XPowerAqch", {
    base: aqch_base,
    deadline,
    owner,
  });
  console.log(`AQCH_MOE_V4a=${aqch_moe.address}`);
  //
  // deploy XPowerQrsh[New]
  //
  const qrsh_moe = await deploy("XPowerQrsh", {
    base: qrsh_base,
    deadline,
    owner,
  });
  console.log(`QRSH_MOE_V4a=${qrsh_moe.address}`);
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
