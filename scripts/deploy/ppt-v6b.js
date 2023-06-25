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
const { unify } = require("../unify");
const { wait } = require("../wait");

/**
 * @returns list of base contract addresses
 */
function ppt_bases(token, versions = ["V4a", "V5a", "V5b", "V5c", "V6a"]) {
  return versions.map((version) => {
    if (version >= "V6a") {
      token = "XPOW";
    }
    const ppt_base = process.env[`${token}_PPT_${version}`];
    assert(ppt_base, `missing ${token}_PPT_${version}`);
    return ppt_base;
  });
}
/**
 * Hardhat *always* runs the compile task when running scripts with its command
 * line interface. But, if this script is run *directly* using `node`, then you
 * may want to call compile manually to make sure everything is compiled:
 *
 * > await hre.run('compile');
 */
async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  // addresses XPowerPpt[Old]
  const thor_ppt_base = ppt_bases("THOR");
  assert(thor_ppt_base.length === 5);
  const loki_ppt_base = ppt_bases("LOKI");
  assert(loki_ppt_base.length === 5);
  const odin_ppt_base = ppt_bases("ODIN");
  assert(odin_ppt_base.length === 5);
  // addresses XPowerPpt[Uri]
  const xpow_ppt_uri = process.env.XPOW_PPT_URI;
  assert(xpow_ppt_uri, "missing XPOW_PPT_URI");
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy XPowerPpt[New]:
  //
  const xpow_ppt_base = unify(thor_ppt_base, loki_ppt_base, odin_ppt_base);
  const xpow = await deploy("XPowerPpt", {
    ppt_uri: xpow_ppt_uri,
    ppt_base: xpow_ppt_base,
    deadline,
  });
  console.log(`XPOW_PPT_V6b=${xpow.ppt.address}`);
  //
  // verify contract(s):
  //
  await verify("XPowerPpt", xpow.ppt, xpow_ppt_uri, xpow_ppt_base, deadline);
}
async function deploy(name, { ppt_uri, ppt_base, deadline }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(ppt_uri, ppt_base, deadline);
  await wait(contract.deployTransaction);
  return { ppt: contract };
}
async function verify(name, { address }, ...args) {
  if (hre.network.name.match(/mainnet|fuji/)) {
    return await hre.run("verify:verify", {
      address,
      contract: `contracts/XPowerPpt.sol:${name}`,
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
