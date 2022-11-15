const assert = require("assert");

const { main: deploy_moe_v5a } = require("./deploy-roles/moe-v5a");
const { main: deploy_nft_v5a } = require("./deploy-roles/nft-v5a");
const { main: deploy_ppt_v5a } = require("./deploy-roles/ppt-v5a");
const { main: deploy_sov_v5a } = require("./deploy-roles/sov-v5a");
const { main: deploy_mty_v5a } = require("./deploy-roles/moe-v5a.treasury");

const { main: deploy_moe_v5b } = require("./deploy-roles/moe-v5b");
const { main: deploy_nft_v5b } = require("./deploy-roles/nft-v5b");
const { main: deploy_ppt_v5b } = require("./deploy-roles/ppt-v5b");
const { main: deploy_sov_v5b } = require("./deploy-roles/sov-v5b");
const { main: deploy_mty_v5b } = require("./deploy-roles/moe-v5b.treasury");

async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  //
  // deploy v5a contract roles:
  //
  await deploy_moe_v5a();
  await deploy_nft_v5a();
  await deploy_ppt_v5a();
  await deploy_sov_v5a();
  await deploy_mty_v5a();
  //
  // deploy v5b contract roles:
  //
  await deploy_moe_v5b();
  await deploy_nft_v5b();
  await deploy_ppt_v5b();
  await deploy_sov_v5b();
  await deploy_mty_v5b();
  //
  // show ownership address:
  //
  console.log(`..w/admin at:${owner}`);
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
