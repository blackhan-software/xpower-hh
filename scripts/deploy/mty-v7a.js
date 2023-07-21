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
  const thor_moe_link = process.env.THOR_MOE_V7a;
  assert(thor_moe_link, "missing THOR_MOE_V7a");
  const loki_moe_link = process.env.LOKI_MOE_V7a;
  assert(loki_moe_link, "missing LOKI_MOE_V7a");
  const odin_moe_link = process.env.ODIN_MOE_V7a;
  assert(odin_moe_link, "missing ODIN_MOE_V7a");
  // addresses APower[New]
  const thor_sov_link = process.env.THOR_SOV_V7a;
  assert(thor_sov_link, "missing THOR_SOV_V7a");
  const loki_sov_link = process.env.LOKI_SOV_V7a;
  assert(loki_sov_link, "missing LOKI_SOV_V7a");
  const odin_sov_link = process.env.ODIN_SOV_V7a;
  assert(odin_sov_link, "missing ODIN_SOV_V7a");
  // addresses XPowerPpt[New]
  const xpow_ppt_link = process.env.XPOW_PPT_V7a;
  assert(xpow_ppt_link, "missing XPOW_PPT_V7a");
  //
  // deploy XPOW NftTreasury[New] & re-own APower[New]:
  //
  const xpow_moe_links = [thor_moe_link, loki_moe_link, odin_moe_link];
  const xpow_sov_links = [thor_sov_link, loki_sov_link, odin_sov_link];
  const xpow_treasury = await deploy("MoeTreasury", {
    moe_links: xpow_moe_links,
    sov_links: xpow_sov_links,
    ppt_link: xpow_ppt_link,
  });
  await transfer("APower", {
    sov_link: thor_sov_link,
    treasury: xpow_treasury,
  });
  await transfer("APower", {
    sov_link: loki_sov_link,
    treasury: xpow_treasury,
  });
  await transfer("APower", {
    sov_link: odin_sov_link,
    treasury: xpow_treasury,
  });
  console.log(`XPOW_MTY_V7a=${xpow_treasury.address}`);
  //
  // verify contract(s):
  //
  await verify(
    "MoeTreasury",
    xpow_treasury,
    xpow_moe_links,
    xpow_sov_links,
    xpow_ppt_link
  );
}
async function deploy(mty_name, { moe_links, sov_links, ppt_link }) {
  const mty_factory = await hre.ethers.getContractFactory(mty_name);
  const mty_contract = await mty_factory.deploy(moe_links[1], sov_links[1], ppt_link);
  await wait(mty_contract.deployTransaction);
  return mty_contract;
}
async function transfer(sov_name, { sov_link, treasury }) {
  const sov_factory = await hre.ethers.getContractFactory(sov_name);
  const sov_contract = sov_factory.attach(sov_link);
  const sov_transfer = await sov_contract.transferOwnership(treasury.address);
  await wait(sov_transfer);
}
async function verify(name, { address }, ...args) {
  if (hre.network.name.match(/mainnet|fuji/)) {
    return await hre.run("verify:verify", {
      address,
      contract: `contracts/MoeTreasury.sol:${name}`,
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
