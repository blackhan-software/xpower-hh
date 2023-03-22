const assert = require("assert");

const { main: deploy_moe_v5a } = require("./deploy-roles/moe-v5a");
const { main: deploy_nft_v5a } = require("./deploy-roles/nft-v5a");
const { main: deploy_ppt_v5a } = require("./deploy-roles/ppt-v5a");
const { main: deploy_sov_v5a } = require("./deploy-roles/sov-v5a");
const { main: deploy_mty_v5a } = require("./deploy-roles/mty-v5a");

const { main: deploy_moe_v5b } = require("./deploy-roles/moe-v5b");
const { main: deploy_nft_v5b } = require("./deploy-roles/nft-v5b");
const { main: deploy_ppt_v5b } = require("./deploy-roles/ppt-v5b");
const { main: deploy_sov_v5b } = require("./deploy-roles/sov-v5b");
const { main: deploy_mty_v5b } = require("./deploy-roles/mty-v5b");

const { main: deploy_moe_v5c } = require("./deploy-roles/moe-v5c");
const { main: deploy_nft_v5c } = require("./deploy-roles/nft-v5c");
const { main: deploy_ppt_v5c } = require("./deploy-roles/ppt-v5c");
const { main: deploy_sov_v5c } = require("./deploy-roles/sov-v5c");
const { main: deploy_mty_v5c } = require("./deploy-roles/mty-v5c");

const { main: deploy_moe_v6a } = require("./deploy-roles/moe-v6a");
const { main: deploy_nft_v6a } = require("./deploy-roles/nft-v6a");
const { main: deploy_ppt_v6a } = require("./deploy-roles/ppt-v6a");
const { main: deploy_sov_v6a } = require("./deploy-roles/sov-v6a");
const { main: deploy_mty_v6a } = require("./deploy-roles/mty-v6a");

const { main: deploy_moe_v6b } = require("./deploy-roles/moe-v6b");
const { main: deploy_nft_v6b } = require("./deploy-roles/nft-v6b");
const { main: deploy_ppt_v6b } = require("./deploy-roles/ppt-v6b");
const { main: deploy_sov_v6b } = require("./deploy-roles/sov-v6b");
const { main: deploy_mty_v6b } = require("./deploy-roles/mty-v6b");

const { main: deploy_moe_v6c } = require("./deploy-roles/moe-v6c");
const { main: deploy_nft_v6c } = require("./deploy-roles/nft-v6c");
const { main: deploy_ppt_v6c } = require("./deploy-roles/ppt-v6c");
const { main: deploy_sov_v6c } = require("./deploy-roles/sov-v6c");
const { main: deploy_mty_v6c } = require("./deploy-roles/mty-v6c");

const { main: deploy_moe_v7a } = require("./deploy-roles/moe-v7a");
const { main: deploy_nft_v7a } = require("./deploy-roles/nft-v7a");
const { main: deploy_ppt_v7a } = require("./deploy-roles/ppt-v7a");
const { main: deploy_sov_v7a } = require("./deploy-roles/sov-v7a");
const { main: deploy_mty_v7a } = require("./deploy-roles/mty-v7a");

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
  // deploy v5c contract roles:
  //
  await deploy_moe_v5c();
  await deploy_nft_v5c();
  await deploy_ppt_v5c();
  await deploy_sov_v5c();
  await deploy_mty_v5c();
  //
  // deploy v6a contract roles:
  //
  await deploy_moe_v6a();
  await deploy_nft_v6a();
  await deploy_ppt_v6a();
  await deploy_sov_v6a();
  await deploy_mty_v6a();
  //
  // deploy v6b contract roles:
  //
  await deploy_moe_v6b();
  await deploy_nft_v6b();
  await deploy_ppt_v6b();
  await deploy_sov_v6b();
  await deploy_mty_v6b();
  //
  // deploy v6c contract roles:
  //
  await deploy_moe_v6c();
  await deploy_nft_v6c();
  await deploy_ppt_v6c();
  await deploy_sov_v6c();
  await deploy_mty_v6c();
  //
  // deploy v7a contract roles:
  //
  await deploy_moe_v7a();
  await deploy_nft_v7a();
  await deploy_ppt_v7a();
  await deploy_sov_v7a();
  await deploy_mty_v7a();
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
