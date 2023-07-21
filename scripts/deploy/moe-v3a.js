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
const { wait } = require("../wait");

/**
 * @returns list of base contract addresses
 */
function moe_bases(token, versions = ["V2a"]) {
  return versions.map((version) => {
    const moe_base = process.env[`${token}_MOE_${version}`];
    assert(moe_base, `missing ${token}_MOE_${version}`);
    return moe_base;
  });
}
/**
 * Hardhat *always* runs the compile task when running scripts with its command
 * line interface. But, if this script is run *directly* using `node`, then you
 * may want to call compile manually to make sure everything is compiled:
 *
 * > await hre.run("compile");
 */
async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  // addresses XPower[Old]
  const thor_moe_base = moe_bases("THOR");
  assert(thor_moe_base.length === 1);
  const loki_moe_base = moe_bases("LOKI");
  assert(loki_moe_base.length === 1);
  const odin_moe_base = moe_bases("ODIN");
  assert(odin_moe_base.length === 1);
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy XPower[New]
  //
  const thor_moe = await deploy("XPower", {
    moe_base: thor_moe_base,
    deadline,
    owner,
  });
  console.log(`THOR_MOE_V3a=${thor_moe.address}`);
  //
  // deploy XPower[New]
  //
  const loki_moe = await deploy("XPower", {
    moe_base: loki_moe_base,
    deadline,
    owner,
  });
  console.log(`LOKI_MOE_V3a=${loki_moe.address}`);
  //
  // deploy XPower[New]
  //
  const odin_moe = await deploy("XPower", {
    moe_base: odin_moe_base,
    deadline,
    owner,
  });
  console.log(`ODIN_MOE_V3a=${odin_moe.address}`);
}
async function deploy(name, { moe_base, deadline, owner }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(moe_base, deadline);
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
