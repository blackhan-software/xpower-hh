const assert = require("assert");
const { transferMoeRoles } = require("../roles");

async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  //
  // transfer roles:
  //
  await transferMoeRoles("XPowerThor", "THOR_MOE_V5c", { to: owner });
  await transferMoeRoles("XPowerLoki", "LOKI_MOE_V5c", { to: owner });
  await transferMoeRoles("XPowerOdin", "ODIN_MOE_V5c", { to: owner });
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