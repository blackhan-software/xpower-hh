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
  // addresses APower[New]
  const thor_sov_link = process.env.THOR_SOV_V5c;
  assert(thor_sov_link, "missing THOR_SOV_V5c");
  const loki_sov_link = process.env.LOKI_SOV_V5c;
  assert(loki_sov_link, "missing LOKI_SOV_V5c");
  const odin_sov_link = process.env.ODIN_SOV_V5c;
  assert(odin_sov_link, "missing ODIN_SOV_V5c");
  // addresses XPower[New]
  const thor_moe_link = process.env.THOR_MOE_V5c;
  assert(thor_moe_link, "missing THOR_MOE_V5c");
  const loki_moe_link = process.env.LOKI_MOE_V5c;
  assert(loki_moe_link, "missing LOKI_MOE_V5c");
  const odin_moe_link = process.env.ODIN_MOE_V5c;
  assert(odin_moe_link, "missing ODIN_MOE_V5c");
  // addresses XPowerPpt[New]
  const thor_ppt_link = process.env.THOR_PPT_V5c;
  assert(thor_ppt_link, "missing THOR_PPT_V5c");
  const loki_ppt_link = process.env.LOKI_PPT_V5c;
  assert(loki_ppt_link, "missing LOKI_PPT_V5c");
  const odin_ppt_link = process.env.ODIN_PPT_V5c;
  assert(odin_ppt_link, "missing ODIN_PPT_V5c");
  //
  // deploy THOR NftTreasury[New] & re-own APowerThor[New]:
  //
  const thor = await deploy(["MoeTreasury", "APowerThor"], {
    sov_link: thor_sov_link,
    moe_link: thor_moe_link,
    ppt_link: thor_ppt_link,
  });
  console.log(`THOR_MTY_V5c=${thor.mty.address}`);
  //
  // deploy LOKI NftTreasury[New] & re-own APowerLoki[New]:
  //
  const loki = await deploy(["MoeTreasury", "APowerLoki"], {
    sov_link: loki_sov_link,
    moe_link: loki_moe_link,
    ppt_link: loki_ppt_link,
  });
  console.log(`LOKI_MTY_V5c=${loki.mty.address}`);
  //
  // deploy ODIN NftTreasury[New] & re-own APowerOdin[New]:
  //
  const odin = await deploy(["MoeTreasury", "APowerOdin"], {
    sov_link: odin_sov_link,
    moe_link: odin_moe_link,
    ppt_link: odin_ppt_link,
  });
  console.log(`ODIN_MTY_V5c=${odin.mty.address}`);
  //
  // verify contract(s):
  //
  await verify(
    "MoeTreasury",
    thor.mty,
    thor_sov_link,
    thor_moe_link,
    thor_ppt_link
  );
}
async function deploy([mty_name, sov_name], { sov_link, moe_link, ppt_link }) {
  const mty_factory = await hre.ethers.getContractFactory(mty_name);
  const mty_contract = await mty_factory.deploy(sov_link, moe_link, ppt_link);
  await wait(mty_contract.deployTransaction);
  const sov_factory = await hre.ethers.getContractFactory(sov_name);
  const sov_contract = sov_factory.attach(sov_link);
  const sov_transfer = await sov_contract.transferOwnership(
    mty_contract.address
  );
  await wait(sov_transfer);
  return { mty: mty_contract };
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
