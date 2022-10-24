const assert = require("assert");
const { transferRoles } = require("../roles");

async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  //
  // transfer roles:
  //
  await transferRoles("MoeTreasury", "THOR_MTY_V5a", { to: owner });
  await transferRoles("MoeTreasury", "LOKI_MTY_V5a", { to: owner });
  await transferRoles("MoeTreasury", "ODIN_MTY_V5a", { to: owner });
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
