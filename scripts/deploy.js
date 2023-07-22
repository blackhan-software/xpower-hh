const assert = require("assert");

const { main: deploy_moe_v1a } = require("./deploy/moe-v1a");
const { main: deploy_moe_v2a } = require("./deploy/moe-v2a");
const { main: deploy_moe_v3a } = require("./deploy/moe-v3a");
const { main: deploy_moe_v4a } = require("./deploy/moe-v4a");
const { main: deploy_moe_v5a } = require("./deploy/moe-v5a");
const { main: deploy_moe_v5b } = require("./deploy/moe-v5b");
const { main: deploy_moe_v5c } = require("./deploy/moe-v5c");
const { main: deploy_moe_v6a } = require("./deploy/moe-v6a");
const { main: deploy_moe_v6b } = require("./deploy/moe-v6b");
const { main: deploy_moe_v6c } = require("./deploy/moe-v6c");
const { main: deploy_moe_v7a } = require("./deploy/moe-v7a");
const { main: deploy_moe_v7b } = require("./deploy/moe-v7b");
const { main: deploy_moe_v7c } = require("./deploy/moe-v7c");
const { main: deploy_moe_v8a } = require("./deploy/moe-v8a");

const { main: deploy_nft_v2a } = require("./deploy/nft-v2a");
const { main: deploy_nft_v2b } = require("./deploy/nft-v2b");
const { main: deploy_nft_v2c } = require("./deploy/nft-v2c");
const { main: deploy_nft_v3a } = require("./deploy/nft-v3a");
const { main: deploy_nft_v3b } = require("./deploy/nft-v3b");
const { main: deploy_nft_v4a } = require("./deploy/nft-v4a");
const { main: deploy_nft_v5a } = require("./deploy/nft-v5a");
const { main: deploy_nft_v5b } = require("./deploy/nft-v5b");
const { main: deploy_nft_v5c } = require("./deploy/nft-v5c");
const { main: deploy_nft_v6a } = require("./deploy/nft-v6a");
const { main: deploy_nft_v6b } = require("./deploy/nft-v6b");
const { main: deploy_nft_v6c } = require("./deploy/nft-v6c");
const { main: deploy_nft_v7a } = require("./deploy/nft-v7a");
const { main: deploy_nft_v7b } = require("./deploy/nft-v7b");
const { main: deploy_nft_v7c } = require("./deploy/nft-v7c");
const { main: deploy_nft_v8a } = require("./deploy/nft-v8a");

const { main: deploy_ppt_v4a } = require("./deploy/ppt-v4a");
const { main: deploy_ppt_v5a } = require("./deploy/ppt-v5a");
const { main: deploy_ppt_v5b } = require("./deploy/ppt-v5b");
const { main: deploy_ppt_v5c } = require("./deploy/ppt-v5c");
const { main: deploy_ppt_v6a } = require("./deploy/ppt-v6a");
const { main: deploy_ppt_v6b } = require("./deploy/ppt-v6b");
const { main: deploy_ppt_v6c } = require("./deploy/ppt-v6c");
const { main: deploy_ppt_v7a } = require("./deploy/ppt-v7a");
const { main: deploy_ppt_v7b } = require("./deploy/ppt-v7b");
const { main: deploy_ppt_v7c } = require("./deploy/ppt-v7c");
const { main: deploy_ppt_v8a } = require("./deploy/ppt-v8a");

const { main: deploy_sov_v5a } = require("./deploy/sov-v5a");
const { main: deploy_sov_v5b } = require("./deploy/sov-v5b");
const { main: deploy_sov_v5c } = require("./deploy/sov-v5c");
const { main: deploy_sov_v6a } = require("./deploy/sov-v6a");
const { main: deploy_sov_v6b } = require("./deploy/sov-v6b");
const { main: deploy_sov_v6c } = require("./deploy/sov-v6c");
const { main: deploy_sov_v7a } = require("./deploy/sov-v7a");
const { main: deploy_sov_v7b } = require("./deploy/sov-v7b");
const { main: deploy_sov_v7c } = require("./deploy/sov-v7c");
const { main: deploy_sov_v8a } = require("./deploy/sov-v8a");

const { main: deploy_mty_v4a } = require("./deploy/mty-v4a");
const { main: deploy_mty_v5a } = require("./deploy/mty-v5a");
const { main: deploy_mty_v5b } = require("./deploy/mty-v5b");
const { main: deploy_mty_v5c } = require("./deploy/mty-v5c");
const { main: deploy_mty_v6a } = require("./deploy/mty-v6a");
const { main: deploy_mty_v6b } = require("./deploy/mty-v6b");
const { main: deploy_mty_v6c } = require("./deploy/mty-v6c");
const { main: deploy_mty_v7a } = require("./deploy/mty-v7a");
const { main: deploy_mty_v7b } = require("./deploy/mty-v7b");
const { main: deploy_mty_v7c } = require("./deploy/mty-v7c");
const { main: deploy_mty_v8a } = require("./deploy/mty-v8a");

const { main: deploy_pty_v4a } = require("./deploy/pty-v4a");
const { main: deploy_pty_v5a } = require("./deploy/pty-v5a");
const { main: deploy_pty_v5b } = require("./deploy/pty-v5b");
const { main: deploy_pty_v5c } = require("./deploy/pty-v5c");
const { main: deploy_pty_v6a } = require("./deploy/pty-v6a");
const { main: deploy_pty_v6b } = require("./deploy/pty-v6b");
const { main: deploy_pty_v6c } = require("./deploy/pty-v6c");
const { main: deploy_pty_v7a } = require("./deploy/pty-v7a");
const { main: deploy_pty_v7b } = require("./deploy/pty-v7b");
const { main: deploy_pty_v7c } = require("./deploy/pty-v7c");
const { main: deploy_pty_v8a } = require("./deploy/pty-v8a");

async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  //
  // deploy v1a contract(s):
  //
  await deploy_moe_v1a();
  //
  // deploy v2a contract(s):
  //
  await deploy_moe_v2a();
  await deploy_nft_v2a();
  await deploy_nft_v2b();
  await deploy_nft_v2c();
  //
  // deploy v3a contract(s):
  //
  await deploy_moe_v3a();
  await deploy_nft_v3a();
  await deploy_nft_v3b();
  //
  // deploy v4a contract(s):
  //
  await deploy_moe_v4a();
  await deploy_nft_v4a();
  await deploy_ppt_v4a();
  await deploy_mty_v4a();
  await deploy_pty_v4a();
  //
  // deploy v5a contract(s):
  //
  await deploy_moe_v5a();
  await deploy_nft_v5a();
  await deploy_ppt_v5a();
  await deploy_sov_v5a();
  await deploy_mty_v5a();
  await deploy_pty_v5a();
  //
  // deploy v5b contract(s):
  //
  await deploy_moe_v5b();
  await deploy_nft_v5b();
  await deploy_ppt_v5b();
  await deploy_sov_v5b();
  await deploy_mty_v5b();
  await deploy_pty_v5b();
  //
  // deploy v5c contract(s):
  //
  await deploy_moe_v5c();
  await deploy_nft_v5c();
  await deploy_ppt_v5c();
  await deploy_sov_v5c();
  await deploy_mty_v5c();
  await deploy_pty_v5c();
  //
  // deploy v6a contract(s):
  //
  await deploy_moe_v6a();
  await deploy_nft_v6a();
  await deploy_ppt_v6a();
  await deploy_sov_v6a();
  await deploy_mty_v6a();
  await deploy_pty_v6a();
  //
  // deploy v6b contract(s):
  //
  await deploy_moe_v6b();
  await deploy_nft_v6b();
  await deploy_ppt_v6b();
  await deploy_sov_v6b();
  await deploy_mty_v6b();
  await deploy_pty_v6b();
  //
  // deploy v6c contract(s):
  //
  await deploy_moe_v6c();
  await deploy_nft_v6c();
  await deploy_ppt_v6c();
  await deploy_sov_v6c();
  await deploy_mty_v6c();
  await deploy_pty_v6c();
  //
  // deploy v7a contract(s):
  //
  await deploy_moe_v7a();
  await deploy_nft_v7a();
  await deploy_ppt_v7a();
  await deploy_sov_v7a();
  await deploy_mty_v7a();
  await deploy_pty_v7a();
  //
  // deploy v7b contract(s):
  //
  await deploy_moe_v7b();
  await deploy_nft_v7b();
  await deploy_ppt_v7b();
  await deploy_sov_v7b();
  await deploy_mty_v7b();
  await deploy_pty_v7b();
  //
  // deploy v7c contract(s):
  //
  await deploy_moe_v7c();
  await deploy_nft_v7c();
  await deploy_ppt_v7c();
  await deploy_sov_v7c();
  await deploy_mty_v7c();
  await deploy_pty_v7c();
  //
  // deploy v8a contract(s):
  //
  await deploy_moe_v8a();
  await deploy_nft_v8a();
  await deploy_ppt_v8a();
  await deploy_sov_v8a();
  await deploy_mty_v8a();
  await deploy_pty_v8a();
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
