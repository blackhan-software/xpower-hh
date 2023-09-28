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
const { ethers } = require("hardhat");

/**
 * Hardhat *always* runs the compile task when running scripts with its command
 * line interface. But, if this script is run *directly* using `node`, then you
 * may want to call compile manually to make sure everything is compiled:
 *
 * > await hre.run('compile');
 */
async function main() {
  // addresses XPower[New]
  const moe_link = process.env.XPOW_MOE_V9a;
  assert(moe_link, "missing XPOW_MOE_V9a");
  // addresses APower[New]
  const sov_link = process.env.XPOW_SOV_V9a;
  assert(sov_link, "missing XPOW_SOV_V9a");
  // addresses XPowerPpt[New]
  const ppt_link = process.env.XPOW_PPT_V9a;
  assert(ppt_link, "missing XPOW_PPT_V9a");
  //
  // deploy XPOW NftTreasury[New] & re-own APower[New]:
  //
  const { mty } = await deploy("MoeTreasury", {
    moe_link,
    sov_link,
    ppt_link,
  });
  await transfer("XPower", {
    erc_link: moe_link,
    treasury: mty,
  });
  await transfer("APower", {
    erc_link: sov_link,
    treasury: mty,
  });
  console.log(`XPOW_MTY_V9a=${mty.target}`);
  //
  // verify contract(s):
  //
  await verify("MoeTreasury", mty, moe_link, sov_link, ppt_link);
}
async function deploy(mty_name, { moe_link, sov_link, ppt_link }) {
  const factory = await ethers.getContractFactory(mty_name);
  const contract = await factory.deploy(moe_link, sov_link, ppt_link);
  await wait(contract);
  return { mty: contract };
}
async function transfer(erc_name, { erc_link, treasury }) {
  const factory = await ethers.getContractFactory(erc_name);
  const contract = factory.attach(erc_link);
  const transfer = await contract.transferOwnership(treasury.target);
  await wait(transfer);
}
async function verify(name, { target }, ...args) {
  if (hre.network.name.match(/mainnet|fuji/)) {
    return await hre.run("verify:verify", {
      address: target,
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
