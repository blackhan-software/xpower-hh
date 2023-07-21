const assert = require("assert");
const { transferSovRoles } = require("../roles");

async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  //
  // transfer roles:
  //
  await transferSovRoles("APower", "THOR_SOV_V7c", { to: owner });
  await transferSovRoles("APower", "LOKI_SOV_V7c", { to: owner });
  await transferSovRoles("APower", "ODIN_SOV_V7c", { to: owner });
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
