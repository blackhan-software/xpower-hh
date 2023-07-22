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
 * @returns list of base contract addresses
 */
function nft_bases(
  token,
  versions = [
    "V2a",
    "V2b",
    "V2c",
    "V3a",
    "V3b",
    "V4a",
    "V5a",
    "V5b",
    "V5c",
    "V6a",
    "V6b",
    "V6c",
    "V7a",
  ],
) {
  return versions.map((version) => {
    const nft_base = process.env[`${token}_NFT_${version}`];
    assert(nft_base, `missing ${token}_NFT_${version}`);
    return nft_base;
  });
}
/**
 * Hardhat *always* runs the compile task when running scripts with its command
 * line interface. But, if this script is run *directly* using `node`, then you
 * may want to call compile manually to make sure everything is compiled:
 *
 * > await hre.run('compile');
 */
async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  // addresses XPowerNft[Old]
  const xpow_nft_base = nft_bases("XPOW");
  assert(xpow_nft_base.length === 13);
  // addresses XPower[New]
  const xpow_moe_link = process.env.XPOW_MOE_V7b;
  assert(xpow_moe_link, "missing XPOW_MOE_V7b");
  // addresses XPowerNft[Uri]
  const xpow_nft_uri = process.env.XPOW_NFT_URI;
  assert(xpow_nft_uri, "missing XPOW_NFT_URI");
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy XPowerNft[New]:
  //
  const { nft } = await deploy("XPowerNft", {
    moe_link: xpow_moe_link,
    nft_uri: xpow_nft_uri,
    nft_base: xpow_nft_base,
    deadline,
    owner,
  });
  console.log(`XPOW_NFT_V7b=${nft.target}`);
  //
  // verify contract(s):
  //
  await verify(
    "XPowerNft",
    nft,
    xpow_moe_link,
    xpow_nft_uri,
    xpow_nft_base,
    deadline,
  );
}
async function deploy(name, { moe_link, nft_uri, nft_base, deadline, owner }) {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.deploy(moe_link, nft_uri, nft_base, deadline);
  await wait(contract);
  const transfer = await contract.transferOwnership(owner);
  await wait(transfer);
  return { nft: contract };
}
async function verify(name, { target }, ...args) {
  if (hre.network.name.match(/mainnet|fuji/)) {
    return await hre.run("verify:verify", {
      address: target,
      contract: `contracts/XPowerNft.sol:${name}`,
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
