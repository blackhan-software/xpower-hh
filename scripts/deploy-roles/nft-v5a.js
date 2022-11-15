const assert = require("assert");
const { transferNftRoles } = require("../roles");

async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  //
  // transfer roles:
  //
  await transferNftRoles("XPowerThorNft", "THOR_NFT_V5a", { to: owner });
  await transferNftRoles("XPowerLokiNft", "LOKI_NFT_V5a", { to: owner });
  await transferNftRoles("XPowerOdinNft", "ODIN_NFT_V5a", { to: owner });
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
