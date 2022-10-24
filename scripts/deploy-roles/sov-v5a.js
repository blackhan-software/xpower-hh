const assert = require("assert");
const { transferRoles } = require("../roles");

async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  //
  // transfer roles:
  //
  await transferRoles("APowerThor", "THOR_SOV_V5a", { to: owner });
  await transferRoles("APowerLoki", "LOKI_SOV_V5a", { to: owner });
  await transferRoles("APowerOdin", "ODIN_SOV_V5a", { to: owner });
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
