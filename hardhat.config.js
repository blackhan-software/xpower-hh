/* globals hre */
const { defaultAbiCoder: abi } = require("ethers/lib/utils");
const { keccak256 } = require("ethers/lib/utils");
const { BigNumber } = require("ethers");

const { task } = require("hardhat/config");
const assert = require("assert");
const crypto = require("crypto");
require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

/**
 * List accounts; @see: https://hardhat.org/guides/create-task.html
 */
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();
  assert(accounts.length > 0, "missing accounts");
  for (const { address } of accounts) {
    console.log(address);
  }
});

/**
 * List balances of accounts for AVAX coins
 */
task("balances-avax", "Prints the list of balances for AVAX coins").setAction(
  async (args, hre) => {
    const accounts = await hre.ethers.getSigners();
    assert(accounts.length > 0, "missing accounts");
    for (const { address } of accounts) {
      const balance = await hre.ethers.provider.getBalance(address);
      console.log(`${address} => ${balance.toString()} nAVAX`);
    }
  }
);

/**
 * List balances of accounts for XPOW tokens
 */
task("balances-xpow", "Prints the list of balances for XPOW tokens")
  .addParam("token", "xpow-cpu, xpow-gpu or xpow-asic", "xpow-cpu")
  .setAction(async (args, hre) => {
    const token = normalize(args.token || "xpow-cpu");
    assert(typeof token === "string", "token is not a string");
    const accounts = await hre.ethers.getSigners();
    assert(accounts.length > 0, "missing accounts");
    const xpower = await contract(token);
    assert(xpower, "missing contract");
    for (const { address } of accounts) {
      const balance = await xpower.balanceOf(address);
      console.log(`${address} => ${balance.toString()} ${token}`);
    }
  });

/**
 * Mine (and mint) for XPOW tokens
 */
task("mine", "Mines for XPOW tokens")
  .addParam("cache", "cache block-hash", "false")
  .addParam("mint", "auto-mint if possible", "false")
  .addParam("threshold", "threshold of ignorance", "1")
  .addParam("token", "xpow-cpu, xpow-gpu or xpow-asic", "xpow-cpu")
  .setAction(async (args, hre) => {
    // process task arguments
    const cache = JSON.parse(args.cache || "false");
    assert(typeof cache === "boolean", "cache is not a boolean");
    const mint = JSON.parse(args.mint || "false");
    assert(typeof mint === "boolean", "mint is not a boolean");
    const threshold = JSON.parse(args.threshold || "1");
    assert(typeof threshold === "number", "threshold is not a number");
    assert(threshold > 0, "threshold is not larger than zero");
    const token = normalize(args.token || "xpow-cpu");
    assert(typeof token === "string", "token is not a string");
    // process environment vars
    const miner_address = process.env.MINER_ADDRESS;
    assert(miner_address, "missing MINER_ADDRESS");
    // get signer for miner and connect to contract
    const xpower = await contract(token);
    assert(xpower, "missing contract");
    const signers = await hre.ethers.getSigners();
    assert(signers.length > 0, "missing signers");
    const miner = signers.filter((s) => s.address === miner_address)[0];
    assert(miner, "missing signer for miner-address");
    const connect = xpower.connect(miner);
    assert(connect, "missing connection");
    // get and cache most recent block-hash (if flag is set)
    let { hash: block_hash } = await hre.ethers.provider.getBlock();
    assert(block_hash, "missing block-hash");
    if (cache) {
      const init = await xpower.init();
      assert(init, "failed to cache block-hash");
      ({ block_hash } = await new Promise((resolve) => {
        xpower.once("Init", (cached_hash, timestamp) => {
          resolve({ block_hash: cached_hash, timestamp });
        });
      }));
    }
    while (true) {
      const nonce = BigNumber.from(crypto.randomBytes(32));
      const amount = mine(token, nonce, miner_address, block_hash);
      if (!amount.isZero() && amount.gte(threshold)) {
        const xnonce = nonce.toHexString();
        if (mint) {
          try {
            const minted = await xpower.mint(nonce, block_hash);
            assert(minted, "failed to mint token(s)");
            console.log(`[MINT] nonce = ${xnonce} => ${amount} ${token}`);
          } catch (ex) {
            console.log(`[FAIL] nonce = ${xnonce} => ${amount} ${token}`);
            console.error(ex);
            break;
          }
        } else {
          console.log(`[WORK] nonce = ${xnonce} => ${amount} ${token}`);
        }
      }
    }
  });

function normalize(token) {
  switch (token.toUpperCase()) {
    case "OLD":
    case "XPOW.OLD":
    case "XPOW-OLD":
    case "XPOW_OLD":
      return "XPOW.OLD";
    case "CPU":
    case "XPOW.CPU":
    case "XPOW-CPU":
    case "XPOW_CPU":
      return "XPOW.CPU";
    case "GPU":
    case "XPOW.GPU":
    case "XPOW-GPU":
    case "XPOW_GPU":
      return "XPOW.GPU";
    case "ASIC":
    case "XPOW.ASIC":
    case "XPOW-ASIC":
    case "XPOW_ASIC":
      return "XPOW.ASIC";
    default:
      return "XPOW.CPU";
  }
}

function mine(token, nonce, address, block_hash) {
  const interval = BigNumber.from(Math.floor(new Date().getTime() / 3_600_000));
  const hash = keccak256(
    abi.encode(
      ["string", "uint256", "address", "uint256", "bytes32"],
      [token, nonce, address, interval, block_hash]
    )
  );
  const zeros = (hash) => {
    const match = hash.match(/^0x(?<zeros>0+)/);
    if (match && match.groups) {
      return match.groups.zeros.length;
    }
    return 0;
  };
  const amount = (hash) => {
    switch (token) {
      case "XPOW.OLD":
        return BigNumber.from(2 ** zeros(hash) - 1);
      case "XPOW.CPU":
        return BigNumber.from(zeros(hash));
      case "XPOW.GPU":
        return BigNumber.from(2 ** zeros(hash) - 1);
      case "XPOW.ASIC":
        return BigNumber.from(16 ** zeros(hash) - 1);
      default:
        return BigNumber.from(zeros(hash));
    }
  };
  return amount(hash);
}

async function contract(token) {
  switch (token) {
    case "XPOW.OLD": {
      const address =
        process.env.XPOWER_ADDRESS_OLD ??
        "0x74A68215AEdf59f317a23E87C13B848a292F27A4";
      assert(address, "missing XPOWER_ADDRESS_OLD");
      return await hre.ethers.getContractAt("XPowerGpu", address);
    }
    case "XPOW.CPU": {
      const address =
        process.env.XPOWER_ADDRESS_CPU ??
        "0xf48C4a0394dD9F27117a43dBb6400872399AB7E7";
      assert(address, "missing XPOWER_ADDRESS_CPU");
      return await hre.ethers.getContractAt("XPowerCpu", address);
    }
    case "XPOW.GPU": {
      const address =
        process.env.XPOWER_ADDRESS_GPU ??
        "0xc63e3B6D0a2d382A74B13D19426b65C0aa5F3648";
      assert(address, "missing XPOWER_ADDRESS_GPU");
      return await hre.ethers.getContractAt("XPowerGpu", address);
    }
    case "XPOW.ASIC": {
      const address =
        process.env.XPOWER_ADDRESS_ASC ??
        "0xE71a2c51b8e0c35ee1F45ADDDb27fda1862Ad880";
      assert(address, "missing XPOWER_ADDRESS_ASC");
      return await hre.ethers.getContractAt("XPowerAsic", address);
    }
    default: {
      const address =
        process.env.XPOWER_ADDRESS_CPU ??
        "0xf48C4a0394dD9F27117a43dBb6400872399AB7E7";
      assert(address, "missing XPOWER_ADDRESS_CPU");
      return await hre.ethers.getContractAt("XPowerCpu", address);
    }
  }
}

/**
 * You need to export an object to set up your configuration.
 *
 * @type import('hardhat/config').HardhatUserConfig
 * @see https://hardhat.org/config
 */
module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      /**
       * @see https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136
       * @todo remove when that issue is closed!
       */
      initialBaseFeePerGas: 0, // workaround
    },
    /* avalanche */ local: {
      url: "http://localhost:9650/ext/bc/C/rpc",
      gas: 2100000,
      gasPrice: 225000000000,
      chainId: 43112,
      accounts: [
        "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027",
        "0x7b4198529994b0dc604278c99d153cfd069d594753d471171a1d102a10438e07",
        "0x15614556be13730e9e8d6eacc1603143e7b96987429df8726384c2ec4502ef6e",
        "0x31b571bf6894a248831ff937bb49f7754509fe93bbd2517c9c73c4144c0e97dc",
        "0x6934bef917e01692b789da754a0eae31a8536eb465e7bff752ea291dad88c675",
        "0xe700bdbdbc279b808b1ec45f8c2370e4616d3a02c336e68d85d4668e08f53cff",
        "0xbbc2865b76ba28016bc2255c7504d000e046ae01934b04c694592a6276988630",
        "0xcdbfd34f687ced8c6968854f8a99ae47712c4f4183b78dcc4a903d1bfe8cbf60",
        "0x86f78c5416151fe3546dece84fda4b4b1e36089f2dbc48496faf3a950f16157c",
        "0x750839e9dbbd2a0910efe40f50b2f3b2f2f59f5580bb4b83bd8c1201cf9a010a",
      ],
    },
    /* avalanche */ fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      gas: 2100000,
      gasPrice: 225000000000,
      chainId: 43113,
      accounts: [],
    },
    /* avalanche */ mainnet: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      gas: 2100000,
      gasPrice: 225000000000,
      chainId: 43114,
      accounts: [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};
