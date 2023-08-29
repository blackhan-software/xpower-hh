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
  // addresses XPowerNft[New]
  const nft_link = process.env.XPOW_NFT_V7c;
  assert(nft_link, "missing XPOW_NFT_V7c");
  // addresses XPowerPpt[New]
  const ppt_link = process.env.XPOW_PPT_V7c;
  assert(ppt_link, "missing XPOW_PPT_V7c");
  // addresses MoeTreasury[New]
  const mty_link = process.env.XPOW_MTY_V7c;
  assert(mty_link, "missing XPOW_MTY_V7c");
  //
  // deploy NftTreasury[New] & re-own XPowerPpt[New]:
  //
  const { nty } = await deploy("NftTreasury", {
    nft_link,
    ppt_link,
    mty_link,
  });
  await transfer("XPowerPpt", {
    ppt_link,
    treasury: nty,
  });
  console.log(`XPOW_PTY_V7c=${nty.target}`);
  //
  // verify contract(s):
  //
  await verify("NftTreasury", nty, nft_link, ppt_link, mty_link);
}
async function deploy(nty_name, { nft_link, ppt_link, mty_link }) {
  const factory = await ethers.getContractFactory(nty_name);
  const contract = await factory.deploy(nft_link, ppt_link, mty_link);
  await wait(contract);
  return { nty: contract };
}
async function transfer(ppt_name, { ppt_link, treasury }) {
  const factory = await ethers.getContractFactory(ppt_name);
  const contract = factory.attach(ppt_link);
  const transfer = await contract.transferOwnership(treasury.target);
  await wait(transfer);
}
async function verify(name, { target }, ...args) {
  if (hre.network.name.match(/mainnet|fuji/)) {
    return await hre.run("verify:verify", {
      address: target,
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
