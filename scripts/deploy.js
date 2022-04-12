const assert = require("assert");

const { main: deploy_moe_v2a } = require("./deploy-moe-v2a");
const { main: deploy_moe_v3a } = require("./deploy-moe-v3a");
const { main: deploy_moe_v4a } = require("./deploy-moe-v4a");
const { main: deploy_nft_v2a } = require("./deploy-nft-v2a");
const { main: deploy_nft_v3a } = require("./deploy-nft-v3a");
const { main: deploy_nft_v3b } = require("./deploy-nft-v3b");
const { main: deploy_nft_v4a } = require("./deploy-nft-v4a");
const { main: deploy_ppt_v4a } = require("./deploy-ppt-v4a");
const { main: deploy_ppt_v4a_treasury } = require("./deploy-ppt-v4a.treasury");
const { main: deploy_moe_v4a_treasury } = require("./deploy-moe-v4a.treasury");

async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  //
  // deploy MoE contracts:
  //
  await deploy_moe_v2a();
  await deploy_moe_v3a();
  await deploy_moe_v4a();
  //
  // deploy NFT contracts:
  //
  await deploy_nft_v2a();
  await deploy_nft_v3a();
  await deploy_nft_v3b();
  await deploy_nft_v4a();
  await deploy_ppt_v4a();
  //
  // deploy PPT & MoE treasuries:
  //
  await deploy_ppt_v4a_treasury();
  await deploy_moe_v4a_treasury();
  //
  // show ownership address:
  //
  console.log(`...w/the ownership at:${owner}`);
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
