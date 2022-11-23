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
  const thor_nft_link = process.env.THOR_NFT_V5c;
  assert(thor_nft_link, "missing THOR_NFT_V5c");
  const loki_nft_link = process.env.LOKI_NFT_V5c;
  assert(loki_nft_link, "missing LOKI_NFT_V5c");
  const odin_nft_link = process.env.ODIN_NFT_V5c;
  assert(odin_nft_link, "missing ODIN_NFT_V5c");
  // addresses XPowerNftStaked[New]
  const thor_ppt_link = process.env.THOR_PPT_V5c;
  assert(thor_ppt_link, "missing THOR_PPT_V5c");
  const loki_ppt_link = process.env.LOKI_PPT_V5c;
  assert(loki_ppt_link, "missing LOKI_PPT_V5c");
  const odin_ppt_link = process.env.ODIN_PPT_V5c;
  assert(odin_ppt_link, "missing ODIN_PPT_V5c");
  //
  // deploy THOR NftTreasury[New] & re-own XPowerThorNftStaked[New]:
  //
  const thor = await deploy(["NftTreasury", "XPowerThorNftStaked"], {
    nft_link: thor_nft_link,
    ppt_link: thor_ppt_link,
  });
  console.log(`THOR_PTY_V5c=${thor.nty.address}`);
  //
  // deploy LOKI NftTreasury[New & re-own XPowerLokiNftStaked[New]:
  //
  const loki = await deploy(["NftTreasury", "XPowerLokiNftStaked"], {
    nft_link: loki_nft_link,
    ppt_link: loki_ppt_link,
  });
  console.log(`LOKI_PTY_V5c=${loki.nty.address}`);
  //
  // deploy ODIN NftTreasury[New] & re-own XPowerOdinNftStaked[New]:
  //
  const odin = await deploy(["NftTreasury", "XPowerOdinNftStaked"], {
    nft_link: odin_nft_link,
    ppt_link: odin_ppt_link,
  });
  console.log(`ODIN_PTY_V5c=${odin.nty.address}`);
  //
  // verify contract(s):
  //
  await verify("NftTreasury", thor.nty, thor_nft_link, thor_ppt_link);
}
async function deploy([nty_name, ppt_name], { nft_link, ppt_link }) {
  const nty_factory = await hre.ethers.getContractFactory(nty_name);
  const nty_contract = await nty_factory.deploy(nft_link, ppt_link);
  await wait(nty_contract.deployTransaction);
  const ppt_factory = await hre.ethers.getContractFactory(ppt_name);
  const ppt_contract = ppt_factory.attach(ppt_link);
  const ppt_transfer = await ppt_contract.transferOwnership(
    nty_contract.address
  );
  await wait(ppt_transfer);
  return { nty: nty_contract };
}
async function verify(name, { address }, ...args) {
  if (hre.network.name.match(/mainnet|fuji/)) {
    return await hre.run("verify:verify", {
      address,
      contract: `contracts/NftTreasury.sol:${name}`,
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
