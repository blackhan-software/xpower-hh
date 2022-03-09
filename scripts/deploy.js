const assert = require("assert");

const { main: deploy_xpow_v2 } = require("./deploy-xpow-v2");
const { main: deploy_xpow_v3 } = require("./deploy-xpow-v3");
const { main: deploy_nfts_v2 } = require("./deploy-nfts-v2");
const { main: deploy_nfts_v3a } = require("./deploy-nfts-v3a");
const { main: deploy_nfts_v3b } = require("./deploy-nfts-v3b");

async function main() {
  const owner = process.env.OWNER_ADDRESS;
  assert(owner, "missing OWNER_ADDRESS");
  //
  // deploy contracts for XPOW:
  //
  await deploy_xpow_v2();
  await deploy_xpow_v3();
  //
  // deploy contracts for NFTs:
  //
  await deploy_nfts_v2();
  await deploy_nfts_v3a();
  await deploy_nfts_v3b();
  //
  // show ownership address:
  //
  console.log(`... and w/the ownership at:${owner}`);
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
