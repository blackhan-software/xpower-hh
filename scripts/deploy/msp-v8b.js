/**
 * We require the Hardhat Runtime Environment (HRE) explicitly here: The import
 * is optional but useful for running a script in a standalone fashion through:
 *
 * $ node <script>
 *
 * When running the script via `npx hardhat run <script>` you'll find the HRE's
 * members available in the global scope.
 */
const hre = require("hardhat");
const assert = require("assert");
const { wait } = require("../wait");
const { ethers } = require("hardhat");

/**
 * Hardhat *always* runs the compile task when running scripts with its command
 * line interface. But, if this script is run *directly* using `node`, then you
 * may want to call compile manually to make sure everything is compiled:
 *
 * > await hre.run('compile');
 */
async function main() {
  const owner = process.env.FUND_ADDRESS;
  assert(owner, "missing FUND_ADDRESS");
  // addresses XPower[New]
  const moe_link = process.env.XPOW_MOE_V8b;
  assert(moe_link, "missing XPOW_MOE_V8b");
  // addresses MoeTreasury[New]
  const mty_link = process.env.XPOW_MTY_V8b;
  assert(mty_link, "missing XPOW_MTY_V8b");
  //
  // deploy MoeSplitter[New]:
  //
  const { payees, shares } = {
    payees: [owner, mty_link],
    shares: [50, 50],
  };
  const { msp } = await deploy("MoeSplitter", {
    payees,
    shares,
    moe_link,
  });
  console.log(`XPOW_MSP_V8b=${msp.target}`);
  //
  // verify contract(s):
  //
  await verify("MoeSplitter", msp, payees, shares);
}
async function deploy(name, { payees, shares, moe_link }) {
  const factory = await ethers.getContractFactory(name);
  const msp = await factory.deploy(payees, shares);
  await wait(msp);
  const moe = await ethers.getContractAt("XPower", moe_link);
  const transfer = await moe.transferOwnership(msp.target);
  await wait(transfer);
  return { msp };
}
async function verify(name, { target }, ...args) {
  if (hre.network.name.match(/mainnet|fuji/)) {
    return await hre.run("verify:verify", {
      address: target,
      contract: `contracts/MoeSplitter.sol:${name}`,
      constructorArguments: args,
    });
  }
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
