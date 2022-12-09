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
 * @returns list of base contract addresses
 */
function nft_bases(token, versions = ["V3b"]) {
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
  const thor_nft_base = nft_bases("THOR");
  assert(thor_nft_base.length === 1);
  const loki_nft_base = nft_bases("LOKI");
  assert(loki_nft_base.length === 1);
  const odin_nft_base = nft_bases("ODIN");
  assert(odin_nft_base.length === 1);
  // addresses XPower[New]
  const thor_moe_link = process.env.THOR_MOE_V4a;
  assert(thor_moe_link, "missing THOR_MOE_V4a");
  const loki_moe_link = process.env.LOKI_MOE_V4a;
  assert(loki_moe_link, "missing LOKI_MOE_V4a");
  const odin_moe_link = process.env.ODIN_MOE_V4a;
  assert(odin_moe_link, "missing ODIN_MOE_V4a");
  // addresses XPowerNft[Uri]
  const xpow_nft_uri = process.env.XPOW_NFT_URI;
  assert(xpow_nft_uri, "missing XPOW_NFT_URI");
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy XPowerNft[New]:
  //
  const thor_nft = await deploy("XPowerNft", {
    nft_uri: xpow_nft_uri,
    moe_link: [thor_moe_link],
    nft_base: thor_nft_base,
    deadline,
    owner,
  });
  console.log(`THOR_NFT_V4a=${thor_nft.address}`);
  //
  // deploy XPowerNft[New]:
  //
  const loki_nft = await deploy("XPowerNft", {
    nft_uri: xpow_nft_uri,
    moe_link: [loki_moe_link],
    nft_base: loki_nft_base,
    deadline,
    owner,
  });
  console.log(`LOKI_NFT_V4a=${loki_nft.address}`);
  //
  // deploy XPowerNft[New]:
  //
  const odin_nft = await deploy("XPowerNft", {
    nft_uri: xpow_nft_uri,
    moe_link: [odin_moe_link],
    nft_base: odin_nft_base,
    deadline,
    owner,
  });
  console.log(`ODIN_NFT_V4a=${odin_nft.address}`);
}
async function deploy(name, { nft_uri, moe_link, nft_base, deadline, owner }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(nft_uri, moe_link, nft_base, deadline);
  await wait(contract.deployTransaction);
  const transfer = await contract.transferOwnership(owner);
  await wait(transfer);
  return contract;
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
