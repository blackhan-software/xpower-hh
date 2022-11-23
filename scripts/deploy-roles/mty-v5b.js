const assert = require("assert");
const { transferMtyRoles } = require("../roles");

async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  //
  // transfer roles:
  //
  await transferMtyRoles("MoeTreasury", "THOR_MTY_V5b", { to: owner });
  await transferMtyRoles("MoeTreasury", "LOKI_MTY_V5b", { to: owner });
  await transferMtyRoles("MoeTreasury", "ODIN_MTY_V5b", { to: owner });
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
