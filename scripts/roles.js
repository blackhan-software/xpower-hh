const { ethers } = require("hardhat");
const assert = require("assert");
const { wait } = require("./wait");

async function transferMoeRoles(factory_name, contract_name, { to: owner }) {
  assert(owner, "missing owner address");
  const contract_address = process.env[contract_name];
  assert(contract_address, "missing contract address");
  process.stdout.write(`${contract_name}=${contract_address}`);
  const factory = await ethers.getContractFactory(factory_name);
  assert(factory, `missing ${factory_name} factory`);
  const contract = factory.attach(contract_address);
  assert(contract, `missing ${factory_name} contract`);
  const [signer] = await ethers.getSigners();
  assert(signer?.address, "missing signer address");
  await transferRole(contract, {
    role: contract.MOE_SEAL_ADMIN_ROLE(),
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
async function transferNftRoles(factory_name, contract_name, { to: owner }) {
  assert(owner, "missing owner address");
  const contract_address = process.env[contract_name];
  assert(contract_address, "missing contract address");
  process.stdout.write(`${contract_name}=${contract_address}`);
  const factory = await ethers.getContractFactory(factory_name);
  assert(factory, `missing ${factory_name} factory`);
  const contract = factory.attach(contract_address);
  assert(contract, `missing ${factory_name} contract`);
  const [signer] = await ethers.getSigners();
  assert(signer?.address, "missing signer address");
  await transferRole(contract, {
    role: contract.NFT_ROYAL_ADMIN_ROLE(),
    from: signer.address,
    to: owner,
  });
  await transferRole(contract, {
    role: contract.NFT_OPEN_ADMIN_ROLE(),
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
async function transferPptRoles(factory_name, contract_name, { to: owner }) {
  assert(owner, "missing owner address");
  const contract_address = process.env[contract_name];
  assert(contract_address, "missing contract address");
  process.stdout.write(`${contract_name}=${contract_address}`);
  const factory = await ethers.getContractFactory(factory_name);
  assert(factory, `missing ${factory_name} factory`);
  const contract = factory.attach(contract_address);
  assert(contract, `missing ${factory_name} contract`);
  const [signer] = await ethers.getSigners();
  assert(signer?.address, "missing signer address");
  await transferRole(contract, {
    role: contract.NFT_ROYAL_ADMIN_ROLE(),
    from: signer.address,
    to: owner,
  });
  await transferRole(contract, {
    role: contract.NFT_OPEN_ADMIN_ROLE(),
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
async function transferSovRoles(factory_name, contract_name, { to: owner }) {
  assert(owner, "missing owner address");
  const contract_address = process.env[contract_name];
  assert(contract_address, "missing contract address");
  process.stdout.write(`${contract_name}=${contract_address}`);
  const factory = await ethers.getContractFactory(factory_name);
  assert(factory, `missing ${factory_name} factory`);
  const contract = factory.attach(contract_address);
  assert(contract, `missing ${factory_name} contract`);
  const [signer] = await ethers.getSigners();
  assert(signer?.address, "missing signer address");
  await transferRole(contract, {
    role: contract.SOV_SEAL_ADMIN_ROLE(),
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
async function transferMtyRoles(factory_name, contract_name, { to: owner }) {
  assert(owner, "missing owner address");
  const contract_address = process.env[contract_name];
  assert(contract_address, "missing contract address");
  process.stdout.write(`${contract_name}=${contract_address}`);
  const factory = await ethers.getContractFactory(factory_name);
  assert(factory, `missing ${factory_name} factory`);
  const contract = factory.attach(contract_address);
  assert(contract, `missing ${factory_name} contract`);
  const [signer] = await ethers.getSigners();
  assert(signer?.address, "missing signer address");
  await transferRole(contract, {
    role: contract.APR_ADMIN_ROLE(),
    from: signer.address,
    to: owner,
  });
  await transferRole(contract, {
    role: contract.APB_ADMIN_ROLE(),
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
        if (member !== to && to) {
          await wait(
            await contract.grantRole(await role, to, {
              gasLimit: 500_000,
            }),
          );
        }
        if (member === from && from) {
          await wait(
            await contract.renounceRole(await role, from, {
              gasLimit: 500_000,
            }),
          );
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
  transferMoeRoles,
  transferSovRoles,
  transferNftRoles,
  transferPptRoles,
  transferMtyRoles,
};
