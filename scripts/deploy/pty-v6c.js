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
  const xpow_nft_link = process.env.XPOW_NFT_V6c;
  assert(xpow_nft_link, "missing XPOW_NFT_V6c");
  // addresses XPowerPpt[New]
  const xpow_ppt_link = process.env.XPOW_PPT_V6c;
  assert(xpow_ppt_link, "missing XPOW_PPT_V6c");
  //
  // deploy NftTreasury[New] & re-own XPowerPpt[New]:
  //
  const thor = await deploy(["NftTreasury", "XPowerPpt"], {
    nft_link: xpow_nft_link,
    ppt_link: xpow_ppt_link,
  });
  console.log(`XPOW_PTY_V6c=${thor.nty.address}`);
  //
  // verify contract(s):
  //
  await verify("NftTreasury", thor.nty, xpow_nft_link, xpow_ppt_link);
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
