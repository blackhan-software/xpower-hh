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
function moe_bases(
  token,
  versions = ["V2a", "V3a", "V4a", "V5a", "V5b", "V5c"]
) {
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
  assert(thor_moe_base.length === 6);
  const loki_moe_base = moe_bases("LOKI");
  assert(loki_moe_base.length === 6);
  const odin_moe_base = moe_bases("ODIN");
  assert(odin_moe_base.length === 6);
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy XPowerThor[New]
  //
  const thor = await deploy("XPowerThor", {
    moe_base: thor_moe_base,
    deadline,
    owner,
  });
  console.log(`THOR_MOE_V6a=${thor.moe.address}`);
  //
  // deploy XPowerLoki[New]
  //
  const loki = await deploy("XPowerLoki", {
    moe_base: loki_moe_base,
    deadline,
    owner,
  });
  console.log(`LOKI_MOE_V6a=${loki.moe.address}`);
  //
  // deploy XPowerOdin[New]
  //
  const odin = await deploy("XPowerOdin", {
    moe_base: odin_moe_base,
    deadline,
    owner,
  });
  console.log(`ODIN_MOE_V6a=${odin.moe.address}`);
  //
  // verify contract(s):
  //
  await verify("XPowerThor", thor.moe, thor_moe_base, deadline);
  await verify("XPowerLoki", loki.moe, loki_moe_base, deadline);
  await verify("XPowerOdin", odin.moe, odin_moe_base, deadline);
}
async function deploy(name, { moe_base, deadline, owner }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(moe_base, deadline);
  await wait(contract.deployTransaction);
  const transfer = await contract.transferOwnership(owner);
  await wait(transfer);
  return { moe: contract };
}
async function verify(name, { address }, ...args) {
  if (hre.network.name.match(/mainnet|fuji/)) {
    return await hre.run("verify:verify", {
      address,
      contract: `contracts/XPower.sol:${name}`,
      constructorArguments: args,
    });
  }
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
