/**
 * We require the Hardhat Runtime Environment (HRE) explicitly here: The import
 * is optional but useful for running a script in a standalone fashion through:
 *
 * $ node <script>
 *
 * When running the script via `npx hardhat run <script>` you'll find the HRE's
 * members available in the global scope.
 */
const assert = require("assert");
const { wait } = require("../wait");
const { ethers } = require("hardhat");

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
  const xpow_moe_link = process.env.XPOW_MOE_V4a;
  assert(xpow_moe_link, "missing XPOW_MOE_V4a");
  // addresses XPowerPpt[New]
  const xpow_ppt_link = process.env.XPOW_PPT_V4a;
  assert(xpow_ppt_link, "missing XPOW_PPT_V4a");
  //
  // deploy XPOW NftTreasury[New]:
  //
  const { mty } = await deploy("MoeTreasury", {
    moe_links: [xpow_moe_link],
    ppt_link: xpow_ppt_link,
  });
  console.log(`XPOW_MTY_V4a=${mty.target}`);
}
async function deploy(mty_name, { moe_links, sov_links, ppt_link }) {
  const factory = await ethers.getContractFactory(mty_name);
  const contract = await factory.deploy(
    moe_links[0],
    sov_links ?? "0x0000000000000000000000000000000000000000",
    ppt_link,
  );
  await wait(contract);
  return { mty: contract };
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
