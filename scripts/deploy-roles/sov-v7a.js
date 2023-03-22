const assert = require("assert");
const { transferSovRoles } = require("../roles");

async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  //
  // transfer roles:
  //
  await transferSovRoles("APowerThor", "THOR_SOV_V7a", { to: owner });
  await transferSovRoles("APowerLoki", "LOKI_SOV_V7a", { to: owner });
  await transferSovRoles("APowerOdin", "ODIN_SOV_V7a", { to: owner });
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
