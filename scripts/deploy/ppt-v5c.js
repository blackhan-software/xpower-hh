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
function ppt_bases(token, versions = ["V4a", "V5a", "V5b"]) {
  return versions.map((version) => {
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
  // addresses XPowerNftStaked[Old]
  const thor_ppt_base = ppt_bases("THOR");
  assert(thor_ppt_base.length === 3);
  const loki_ppt_base = ppt_bases("LOKI");
  assert(loki_ppt_base.length === 3);
  const odin_ppt_base = ppt_bases("ODIN");
  assert(odin_ppt_base.length === 3);
  // addresses XPowerNftStaked[Uri]
  const thor_ppt_uri = process.env.THOR_PPT_URI;
  assert(thor_ppt_uri, "missing THOR_PPT_URI");
  const loki_ppt_uri = process.env.LOKI_PPT_URI;
  assert(loki_ppt_uri, "missing LOKI_PPT_URI");
  const odin_ppt_uri = process.env.ODIN_PPT_URI;
  assert(odin_ppt_uri, "missing ODIN_PPT_URI");
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy XPowerThorNftStaked[New]:
  //
  const thor = await deploy("XPowerThorNftStaked", {
    ppt_uri: thor_ppt_uri,
    ppt_base: thor_ppt_base,
    deadline,
  });
  console.log(`THOR_PPT_V5c=${thor.ppt.address}`);
  //
  // deploy XPowerLokiNftStaked[New]:
  //
  const loki = await deploy("XPowerLokiNftStaked", {
    ppt_uri: loki_ppt_uri,
    ppt_base: loki_ppt_base,
    deadline,
  });
  console.log(`LOKI_PPT_V5c=${loki.ppt.address}`);
  //
  // deploy XPowerOdinNftStaked[New]:
  //
  const odin = await deploy("XPowerOdinNftStaked", {
    ppt_uri: odin_ppt_uri,
    ppt_base: odin_ppt_base,
    deadline,
  });
  console.log(`ODIN_PPT_V5c=${odin.ppt.address}`);
  //
  // verify contract(s):
  //
  await verify(
    "XPowerThorNftStaked",
    thor.ppt,
    thor_ppt_uri,
    thor_ppt_base,
    deadline
  );
  await verify(
    "XPowerLokiNftStaked",
    loki.ppt,
    loki_ppt_uri,
    loki_ppt_base,
    deadline
  );
  await verify(
    "XPowerOdinNftStaked",
    odin.ppt,
    odin_ppt_uri,
    odin_ppt_base,
    deadline
  );
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
      contract: `contracts/XPowerNftStaked.sol:${name}`,
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
