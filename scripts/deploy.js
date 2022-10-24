const assert = require("assert");

const { main: deploy_moe_v2a } = require("./deploy/moe-v2a");
const { main: deploy_moe_v3a } = require("./deploy/moe-v3a");
const { main: deploy_moe_v4a } = require("./deploy/moe-v4a");
const { main: deploy_moe_v5a } = require("./deploy/moe-v5a");

const { main: deploy_nft_v2a } = require("./deploy/nft-v2a");
const { main: deploy_nft_v3a } = require("./deploy/nft-v3a");
const { main: deploy_nft_v3b } = require("./deploy/nft-v3b");
const { main: deploy_nft_v4a } = require("./deploy/nft-v4a");
const { main: deploy_nft_v5a } = require("./deploy/nft-v5a");
const { main: deploy_ppt_v4a } = require("./deploy/ppt-v4a");
const { main: deploy_ppt_v5a } = require("./deploy/ppt-v5a");

const { main: deploy_pty_v4a } = require("./deploy/ppt-v4a.treasury");
const { main: deploy_pty_v5a } = require("./deploy/ppt-v5a.treasury");
const { main: deploy_mty_v4a } = require("./deploy/moe-v4a.treasury");
const { main: deploy_mty_v5a } = require("./deploy/moe-v5a.treasury");

const { main: deploy_sov_v5a } = require("./deploy/sov-v5a");

async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  //
  // deploy MOE contract(s):
  //
  await deploy_moe_v2a();
  await deploy_moe_v3a();
  await deploy_moe_v4a();
  await deploy_moe_v5a();
  //
  // deploy NFT contract(s):
  //
  await deploy_nft_v2a();
  await deploy_nft_v3a();
  await deploy_nft_v3b();
  await deploy_nft_v4a();
  await deploy_nft_v5a();
  //
  // deploy PPT contract(s):
  //
  await deploy_ppt_v4a();
  await deploy_ppt_v5a();
  //
  // deploy PPT treasury contract(s):
  //
  await deploy_pty_v4a();
  await deploy_pty_v5a();
  //
  // deploy SOV contract(s):
  //
  await deploy_sov_v5a();
  //
  // deploy MOE treasury contract(s):
  //
  await deploy_mty_v4a();
  await deploy_mty_v5a();
  //
  // show ownership address:
  //
  console.log(`..w/owner at:${owner}`);
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
