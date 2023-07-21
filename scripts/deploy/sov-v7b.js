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
function sov_bases(
  token,
  versions = ["V5a", "V5b", "V5c", "V6a", "V6b", "V6c", "V7a"]
) {
  return versions.map((version) => {
    const moe_base = process.env[`${token}_SOV_${version}`];
    assert(moe_base, `missing ${token}_SOV_${version}`);
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
  // addresses APower[Old]
  const thor_sov_base = sov_bases("THOR");
  assert(thor_sov_base.length === 7);
  const loki_sov_base = sov_bases("LOKI");
  assert(loki_sov_base.length === 7);
  const odin_sov_base = sov_bases("ODIN");
  assert(odin_sov_base.length === 7);
  // addresses XPower[New]
  const thor_moe_link = process.env.THOR_MOE_V7b;
  assert(thor_moe_link, "missing THOR_MOE_V7b");
  const loki_moe_link = process.env.LOKI_MOE_V7b;
  assert(loki_moe_link, "missing LOKI_MOE_V7b");
  const odin_moe_link = process.env.ODIN_MOE_V7b;
  assert(odin_moe_link, "missing ODIN_MOE_V7b");
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy APower[New]
  //
  const thor = await deploy("APower", {
    moe_link: thor_moe_link,
    sov_base: thor_sov_base,
    deadline,
  });
  console.log(`THOR_SOV_V7b=${thor.sov.address}`);
  //
  // deploy APower[New]
  //
  const loki = await deploy("APower", {
    moe_link: loki_moe_link,
    sov_base: loki_sov_base,
    deadline,
  });
  console.log(`LOKI_SOV_V7b=${loki.sov.address}`);
  //
  // deploy APower[New]
  //
  const odin = await deploy("APower", {
    moe_link: odin_moe_link,
    sov_base: odin_sov_base,
    deadline,
  });
  console.log(`ODIN_SOV_V7b=${odin.sov.address}`);
  //
  // verify contract(s):
  //
  await verify("APower", thor.sov, thor_moe_link, thor_sov_base, deadline);
  await verify("APower", loki.sov, loki_moe_link, loki_sov_base, deadline);
  await verify("APower", odin.sov, odin_moe_link, odin_sov_base, deadline);
}
async function deploy(name, { moe_link, sov_base, deadline }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(moe_link, sov_base, deadline);
  await wait(contract.deployTransaction);
  return { sov: contract };
}
async function verify(name, { address }, ...args) {
  if (hre.network.name.match(/mainnet|fuji/)) {
    return await hre.run("verify:verify", {
      address,
      contract: `contracts/APower.sol:${name}`,
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
