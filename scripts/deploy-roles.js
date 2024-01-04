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

const { main: deploy_moe_v7b } = require("./deploy-roles/moe-v7b");
const { main: deploy_nft_v7b } = require("./deploy-roles/nft-v7b");
const { main: deploy_ppt_v7b } = require("./deploy-roles/ppt-v7b");
const { main: deploy_sov_v7b } = require("./deploy-roles/sov-v7b");
const { main: deploy_mty_v7b } = require("./deploy-roles/mty-v7b");

const { main: deploy_moe_v7c } = require("./deploy-roles/moe-v7c");
const { main: deploy_nft_v7c } = require("./deploy-roles/nft-v7c");
const { main: deploy_ppt_v7c } = require("./deploy-roles/ppt-v7c");
const { main: deploy_sov_v7c } = require("./deploy-roles/sov-v7c");
const { main: deploy_mty_v7c } = require("./deploy-roles/mty-v7c");

const { main: deploy_moe_v8a } = require("./deploy-roles/moe-v8a");
const { main: deploy_nft_v8a } = require("./deploy-roles/nft-v8a");
const { main: deploy_ppt_v8a } = require("./deploy-roles/ppt-v8a");
const { main: deploy_sov_v8a } = require("./deploy-roles/sov-v8a");
const { main: deploy_mty_v8a } = require("./deploy-roles/mty-v8a");

const { main: deploy_moe_v8b } = require("./deploy-roles/moe-v8b");
const { main: deploy_nft_v8b } = require("./deploy-roles/nft-v8b");
const { main: deploy_ppt_v8b } = require("./deploy-roles/ppt-v8b");
const { main: deploy_sov_v8b } = require("./deploy-roles/sov-v8b");
const { main: deploy_mty_v8b } = require("./deploy-roles/mty-v8b");

const { main: deploy_moe_v8c } = require("./deploy-roles/moe-v8c");
const { main: deploy_nft_v8c } = require("./deploy-roles/nft-v8c");
const { main: deploy_ppt_v8c } = require("./deploy-roles/ppt-v8c");
const { main: deploy_sov_v8c } = require("./deploy-roles/sov-v8c");
const { main: deploy_mty_v8c } = require("./deploy-roles/mty-v8c");

const { main: deploy_moe_v9a } = require("./deploy-roles/moe-v9a");
const { main: deploy_nft_v9a } = require("./deploy-roles/nft-v9a");
const { main: deploy_ppt_v9a } = require("./deploy-roles/ppt-v9a");
const { main: deploy_sov_v9a } = require("./deploy-roles/sov-v9a");
const { main: deploy_mty_v9a } = require("./deploy-roles/mty-v9a");

const { main: deploy_moe_v9b } = require("./deploy-roles/moe-v9b");
const { main: deploy_nft_v9b } = require("./deploy-roles/nft-v9b");
const { main: deploy_ppt_v9b } = require("./deploy-roles/ppt-v9b");
const { main: deploy_sov_v9b } = require("./deploy-roles/sov-v9b");
const { main: deploy_mty_v9b } = require("./deploy-roles/mty-v9b");

const { main: deploy_moe_v9c } = require("./deploy-roles/moe-v9c");
const { main: deploy_nft_v9c } = require("./deploy-roles/nft-v9c");
const { main: deploy_ppt_v9c } = require("./deploy-roles/ppt-v9c");
const { main: deploy_sov_v9c } = require("./deploy-roles/sov-v9c");
const { main: deploy_mty_v9c } = require("./deploy-roles/mty-v9c");

async function main() {
  const owner = process.env.SAFE_ADDRESS;
  assert(owner, "missing SAFE_ADDRESS");
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
  // deploy v7b contract roles:
  //
  await deploy_moe_v7b();
  await deploy_nft_v7b();
  await deploy_ppt_v7b();
  await deploy_sov_v7b();
  await deploy_mty_v7b();
  //
  // deploy v7c contract roles:
  //
  await deploy_moe_v7c();
  await deploy_nft_v7c();
  await deploy_ppt_v7c();
  await deploy_sov_v7c();
  await deploy_mty_v7c();
  //
  // deploy v8a contract roles:
  //
  await deploy_moe_v8a();
  await deploy_nft_v8a();
  await deploy_ppt_v8a();
  await deploy_sov_v8a();
  await deploy_mty_v8a();
  //
  // deploy v8b contract roles:
  //
  await deploy_moe_v8b();
  await deploy_nft_v8b();
  await deploy_ppt_v8b();
  await deploy_sov_v8b();
  await deploy_mty_v8b();
  //
  // deploy v8c contract roles:
  //
  await deploy_moe_v8c();
  await deploy_nft_v8c();
  await deploy_ppt_v8c();
  await deploy_sov_v8c();
  await deploy_mty_v8c();
  //
  // deploy v9a contract roles:
  //
  await deploy_moe_v9a();
  await deploy_nft_v9a();
  await deploy_ppt_v9a();
  await deploy_sov_v9a();
  await deploy_mty_v9a();
  //
  // deploy v9b contract roles:
  //
  await deploy_moe_v9b();
  await deploy_nft_v9b();
  await deploy_ppt_v9b();
  await deploy_sov_v9b();
  await deploy_mty_v9b();
  //
  // deploy v9c contract roles:
  //
  await deploy_moe_v9c();
  await deploy_nft_v9c();
  await deploy_ppt_v9c();
  await deploy_sov_v9c();
  await deploy_mty_v9c();
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
