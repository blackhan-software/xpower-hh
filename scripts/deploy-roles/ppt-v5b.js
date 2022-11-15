const assert = require("assert");
const { transferNftRoles } = require("../roles");

async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  //
  // transfer roles:
  //
  await transferNftRoles("XPowerThorNftStaked", "THOR_PPT_V5b", { to: owner });
  await transferNftRoles("XPowerLokiNftStaked", "LOKI_PPT_V5b", { to: owner });
  await transferNftRoles("XPowerOdinNftStaked", "ODIN_PPT_V5b", { to: owner });
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
