const assert = require("assert");
const { transferRoles } = require("../roles");

async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  //
  // transfer roles:
  //
  await transferRoles("XPowerThor", "THOR_MOE_V5a", { to: owner });
  await transferRoles("XPowerLoki", "LOKI_MOE_V5a", { to: owner });
  await transferRoles("XPowerOdin", "ODIN_MOE_V5a", { to: owner });
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
