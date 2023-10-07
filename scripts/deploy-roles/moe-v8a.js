const assert = require("assert");
const { transferMoeRoles } = require("../roles");

async function main() {
  const owner = process.env.SAFE_ADDRESS;
  assert(owner, "missing SAFE_ADDRESS");
  //
  // transfer roles:
  //
  await transferMoeRoles("XPower", "XPOW_MOE_V8a", { to: owner });
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
