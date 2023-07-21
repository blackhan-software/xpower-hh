const assert = require("assert");
const { transferMoeRoles } = require("../roles");

async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  //
  // transfer roles:
  //
  await transferMoeRoles("XPower", "THOR_MOE_V5a", { to: owner });
  await transferMoeRoles("XPower", "LOKI_MOE_V5a", { to: owner });
  await transferMoeRoles("XPower", "ODIN_MOE_V5a", { to: owner });
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
