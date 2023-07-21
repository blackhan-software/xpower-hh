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
  // addresses XPower[New]
  const thor_moe_link = process.env.THOR_MOE_V6a;
  assert(thor_moe_link, "missing THOR_MOE_V6a");
  const loki_moe_link = process.env.LOKI_MOE_V6a;
  assert(loki_moe_link, "missing LOKI_MOE_V6a");
  const odin_moe_link = process.env.ODIN_MOE_V6a;
  assert(odin_moe_link, "missing ODIN_MOE_V6a");
  // addresses APower[New]
  const thor_sov_link = process.env.THOR_SOV_V6a;
  assert(thor_sov_link, "missing THOR_SOV_V6a");
  const loki_sov_link = process.env.LOKI_SOV_V6a;
  assert(loki_sov_link, "missing LOKI_SOV_V6a");
  const odin_sov_link = process.env.ODIN_SOV_V6a;
  assert(odin_sov_link, "missing ODIN_SOV_V6a");
  // addresses XPowerPpt[New]
  const xpow_ppt_link = process.env.XPOW_PPT_V6a;
  assert(xpow_ppt_link, "missing XPOW_PPT_V6a");
  //
  // deploy THOR NftTreasury[New] & re-own APower[New]:
  //
  const thor_treasury = await deploy("MoeTreasury", {
    moe_links: [thor_moe_link],
    sov_links: [thor_sov_link],
    ppt_link: xpow_ppt_link,
  });
  await transfer("APower", {
    sov_link: thor_sov_link,
    treasury: thor_treasury,
  });
  console.log(`THOR_MTY_V6a=${thor_treasury.address}`);
  //
  // deploy LOKI NftTreasury[New] & re-own APower[New]:
  //
  const loki_treasury = await deploy("MoeTreasury", {
    moe_links: [loki_moe_link],
    sov_links: [loki_sov_link],
    ppt_link: xpow_ppt_link,
  });
  await transfer("APower", {
    sov_link: loki_sov_link,
    treasury: loki_treasury,
  });
  console.log(`LOKI_MTY_V6a=${loki_treasury.address}`);
  //
  // deploy ODIN NftTreasury[New] & re-own APower[New]:
  //
  const odin_treasury = await deploy("MoeTreasury", {
    moe_links: [odin_moe_link],
    sov_links: [odin_sov_link],
    ppt_link: xpow_ppt_link,
  });
  await transfer("APower", {
    sov_link: odin_sov_link,
    treasury: odin_treasury,
  });
  console.log(`ODIN_MTY_V6a=${odin_treasury.address}`);
}
async function deploy(mty_name, { moe_links, sov_links, ppt_link }) {
  const mty_factory = await hre.ethers.getContractFactory(mty_name);
  const mty_contract = await mty_factory.deploy(moe_links[0], sov_links[0], ppt_link);
  await wait(mty_contract.deployTransaction);
  return mty_contract;
}
async function transfer(sov_name, { sov_link, treasury }) {
  const sov_factory = await hre.ethers.getContractFactory(sov_name);
  const sov_contract = sov_factory.attach(sov_link);
  const sov_transfer = await sov_contract.transferOwnership(treasury.address);
  await wait(sov_transfer);
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
