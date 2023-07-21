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
const { unify } = require("../unify");
const { wait } = require("../wait");

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
  ]
) {
  return versions.map((version) => {
    if (version >= "V6a") {
      token = "XPOW";
    }
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
  assert(thor_nft_base.length === 12);
  const loki_nft_base = nft_bases("LOKI");
  assert(loki_nft_base.length === 12);
  const odin_nft_base = nft_bases("ODIN");
  assert(odin_nft_base.length === 12);
  // addresses XPower[New]
  const thor_moe_link = process.env.THOR_MOE_V7a;
  assert(thor_moe_link, "missing THOR_MOE_V7a");
  const loki_moe_link = process.env.LOKI_MOE_V7a;
  assert(loki_moe_link, "missing LOKI_MOE_V7a");
  const odin_moe_link = process.env.ODIN_MOE_V7a;
  assert(odin_moe_link, "missing ODIN_MOE_V7a");
  // addresses XPowerNft[Uri]
  const xpow_nft_uri = process.env.XPOW_NFT_URI;
  assert(xpow_nft_uri, "missing XPOW_NFT_URI");
  // migration:
  const deadline = 126_230_400; // 4 years
  //
  // deploy XPowerNft[New]:
  //
  const xpow_moe_link = [thor_moe_link, loki_moe_link, odin_moe_link];
  const xpow_nft_base = unify(thor_nft_base, loki_nft_base, odin_nft_base);
  const xpow = await deploy("XPowerNft", {
    moe_link: xpow_moe_link,
    nft_uri: xpow_nft_uri,
    nft_base: xpow_nft_base,
    deadline,
    owner,
  });
  console.log(`XPOW_NFT_V7a=${xpow.nft.address}`);
  //
  // verify contract(s):
  //
  await verify(
    "XPowerNft",
    xpow.nft,
    xpow_moe_link,
    xpow_nft_uri,
    xpow_nft_base,
    deadline
  );
}
async function deploy(name, { moe_link, nft_uri, nft_base, deadline, owner }) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(moe_link[1], nft_uri, nft_base, deadline);
  await wait(contract.deployTransaction);
  const transfer = await contract.transferOwnership(owner);
  await wait(transfer);
  return { nft: contract };
}
async function verify(name, { address }, ...args) {
  if (hre.network.name.match(/mainnet|fuji/)) {
    return await hre.run("verify:verify", {
      address,
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
