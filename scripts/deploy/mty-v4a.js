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
 * Hardhat *always* runs the compile task when running scripts with its command
 * line interface. But, if this script is run *directly* using `node`, then you
 * may want to call compile manually to make sure everything is compiled:
 *
 * > await hre.run('compile');
 */
async function main() {
  const none = process.env.NONE_ADDRESS;
  assert(none, "missing NONE_ADDRESS");
  // addresses XPower[New]
  const thor_moe_link = process.env.THOR_MOE_V4a;
  assert(thor_moe_link, "missing THOR_MOE_V4a");
  const loki_moe_link = process.env.LOKI_MOE_V4a;
  assert(loki_moe_link, "missing LOKI_MOE_V4a");
  const odin_moe_link = process.env.ODIN_MOE_V4a;
  assert(odin_moe_link, "missing ODIN_MOE_V4a");
  // addresses XPowerPpt[New]
  const thor_ppt_link = process.env.THOR_PPT_V4a;
  assert(thor_ppt_link, "missing THOR_PPT_V4a");
  const loki_ppt_link = process.env.LOKI_PPT_V4a;
  assert(loki_ppt_link, "missing LOKI_PPT_V4a");
  const odin_ppt_link = process.env.ODIN_PPT_V4a;
  assert(odin_ppt_link, "missing ODIN_PPT_V4a");
  //
  // deploy THOR NftTreasury[New]:
  //
  const thor_treasury = await deploy(["MoeTreasury"], {
    sov_link: none,
    moe_link: thor_moe_link,
    ppt_link: thor_ppt_link,
  });
  console.log(`THOR_MTY_V4a=${thor_treasury.address}`);
  //
  // deploy LOKI NftTreasury[New]:
  //
  const loki_treasury = await deploy(["MoeTreasury"], {
    sov_link: none,
    moe_link: loki_moe_link,
    ppt_link: loki_ppt_link,
  });
  console.log(`LOKI_MTY_V4a=${loki_treasury.address}`);
  //
  // deploy ODIN NftTreasury[New]:
  //
  const odin_treasury = await deploy(["MoeTreasury"], {
    sov_link: none,
    moe_link: odin_moe_link,
    ppt_link: odin_ppt_link,
  });
  console.log(`ODIN_MTY_V4a=${odin_treasury.address}`);
}
async function deploy([mty_name], { sov_link, moe_link, ppt_link }) {
  const mty_factory = await hre.ethers.getContractFactory(mty_name);
  const mty_contract = await mty_factory.deploy(sov_link, moe_link, ppt_link);
  await wait(mty_contract.deployTransaction);
  return mty_contract;
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
