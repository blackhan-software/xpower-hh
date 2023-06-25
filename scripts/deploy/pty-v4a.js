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
  // addresses XPowerNft[New]
  const thor_nft_link = process.env.THOR_NFT_V4a;
  assert(thor_nft_link, "missing THOR_NFT_V4a");
  const loki_nft_link = process.env.LOKI_NFT_V4a;
  assert(loki_nft_link, "missing LOKI_NFT_V4a");
  const odin_nft_link = process.env.ODIN_NFT_V4a;
  assert(odin_nft_link, "missing ODIN_NFT_V4a");
  // addresses XPowerPpt[New]
  const thor_ppt_link = process.env.THOR_PPT_V4a;
  assert(thor_ppt_link, "missing THOR_PPT_V4a");
  const loki_ppt_link = process.env.LOKI_PPT_V4a;
  assert(loki_ppt_link, "missing LOKI_PPT_V4a");
  const odin_ppt_link = process.env.ODIN_PPT_V4a;
  assert(odin_ppt_link, "missing ODIN_PPT_V4a");
  // addresses MoeTreasury[New]
  const thor_mty_link = process.env.THOR_MTY_V4a;
  assert(thor_mty_link, "missing THOR_MTY_V4a");
  const loki_mty_link = process.env.LOKI_MTY_V4a;
  assert(loki_mty_link, "missing LOKI_MTY_V4a");
  const odin_mty_link = process.env.ODIN_MTY_V4a;
  assert(odin_mty_link, "missing ODIN_MTY_V4a");
  //
  // deploy THOR NftTreasury[New] & re-own XPowerPpt[New]:
  //
  const thor = await deploy(["NftTreasury", "XPowerPpt"], {
    nft_link: thor_nft_link,
    ppt_link: thor_ppt_link,
    mty_link: thor_mty_link,
  });
  console.log(`THOR_PTY_V4a=${thor.address}`);
  //
  // deploy LOKI NftTreasury[New & re-own XPowerPpt[New]:
  //
  const loki = await deploy(["NftTreasury", "XPowerPpt"], {
    nft_link: loki_nft_link,
    ppt_link: loki_ppt_link,
    mty_link: loki_mty_link,
  });
  console.log(`LOKI_PTY_V4a=${loki.address}`);
  //
  // deploy ODIN NftTreasury[New] & re-own XPowerPpt[New]:
  //
  const odin = await deploy(["NftTreasury", "XPowerPpt"], {
    nft_link: odin_nft_link,
    ppt_link: odin_ppt_link,
    mty_link: odin_mty_link,
  });
  console.log(`ODIN_PTY_V4a=${odin.address}`);
}
async function deploy([nty_name, ppt_name], { nft_link, ppt_link, mty_link }) {
  const nft_factory = await hre.ethers.getContractFactory(nty_name);
  const nft_contract = await nft_factory.deploy(nft_link, ppt_link, mty_link);
  await wait(nft_contract.deployTransaction);
  const ppt_factory = await hre.ethers.getContractFactory(ppt_name);
  const ppt_contract = ppt_factory.attach(ppt_link);
  const ppt_transfer = await ppt_contract.transferOwnership(
    nft_contract.address
  );
  await wait(ppt_transfer);
  return nft_contract;
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
