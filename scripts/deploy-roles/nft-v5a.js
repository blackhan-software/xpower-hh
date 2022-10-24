const assert = require("assert");
const { transferRoles } = require("../roles");

async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  //
  // transfer roles:
  //
  await transferRoles("XPowerThorNft", "THOR_NFT_V5a", { to: owner });
  await transferRoles("XPowerLokiNft", "LOKI_NFT_V5a", { to: owner });
  await transferRoles("XPowerOdinNft", "ODIN_NFT_V5a", { to: owner });
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
