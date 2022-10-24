const assert = require("assert");

const { main: deploy_moe_v5a } = require("./deploy-roles/moe-v5a");
const { main: deploy_nft_v5a } = require("./deploy-roles/nft-v5a");
const { main: deploy_ppt_v5a } = require("./deploy-roles/ppt-v5a");
const { main: deploy_sov_v5a } = require("./deploy-roles/sov-v5a");
const { main: deploy_mty_v5a } = require("./deploy-roles/moe-v5a.treasury");

async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  //
  // deploy MOE contract roles:
  //
  await deploy_moe_v5a();
  //
  // deploy NFT contract roles:
  //
  await deploy_nft_v5a();
  //
  // deploy PPT contract roles:
  //
  await deploy_ppt_v5a();
  //
  // deploy SOV contract roles:
  //
  await deploy_sov_v5a();
  //
  // deploy MOE treasury roles:
  //
  await deploy_mty_v5a();
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
