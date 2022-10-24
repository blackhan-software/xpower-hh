const assert = require("assert");
const hre = require("hardhat");
const { wait } = require("./wait");

async function transferRoles(factory_name, contract_name, { to: owner }) {
  assert(owner, "missing owner address");
  const contract_address = process.env[contract_name];
  assert(contract_address, "missing contract address");
  process.stdout.write(`${contract_name}=${contract_address}`);
  const factory = await hre.ethers.getContractFactory(factory_name);
  assert(factory, `missing ${factory_name} factory`);
  const contract = factory.attach(contract_address);
  assert(contract, `missing ${factory_name} contract`);
  const signer = await hre.ethers.getSigner();
  assert(signer?.address, "missing signer address");
  await transferRole(contract, {
    role: contract.ALPHA_ADMIN_ROLE(),
    from: signer.address,
    to: owner,
  });
  await transferRole(contract, {
    role: contract.GAMMA_ADMIN_ROLE(),
    from: signer.address,
    to: owner,
  });
  await transferRole(contract, {
    role: contract.DELTA_ADMIN_ROLE(),
    from: signer.address,
    to: owner,
  });
  await transferRole(contract, {
    role: contract.THETA_ADMIN_ROLE(),
    from: signer.address,
    to: owner,
  });
  await transferRole(contract, {
    role: contract.MOE_SEAL_ADMIN_ROLE(),
    from: signer.address,
    to: owner,
  });
  await transferRole(contract, {
    role: contract.SOV_SEAL_ADMIN_ROLE(),
    from: signer.address,
    to: owner,
  });
  await transferRole(contract, {
    role: contract.NFT_SEAL_ADMIN_ROLE(),
    from: signer.address,
    to: owner,
  });
  await transferRole(contract, {
    role: contract.URI_DATA_ADMIN_ROLE(),
    from: signer.address,
    to: owner,
  });
  await transferRole(contract, {
    role: contract.DEFAULT_ADMIN_ROLE(),
    from: signer.address,
    to: owner,
  });
  process.stdout.write("\n");
  return contract;
}
async function transferRole(contract, { role, from, to }) {
  while (true) {
    try {
      const count = await contract.getRoleMemberCount(await role);
      for (let index = 0; index < count; index++) {
        const member = await contract.getRoleMember(await role, index);
        if (member !== to) {
          await wait(await contract.grantRole(await role, to));
        }
        if (member === from) {
          await wait(await contract.renounceRole(await role, from));
        }
      }
      process.stdout.write(".");
    } catch (ex) {
      console.error(ex);
      continue;
    }
    break;
  }
}
module.exports = {
  transferRoles,
  transferRole,
};
