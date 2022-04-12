const { task } = require("hardhat/config");
const assert = require("assert");
require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

const { Token } = require("./source/token");
const { start, workers } = require("./source/cluster");

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
 * List balances of accounts for XPower tokens
 */
task("balances-xpow", "Prints the list of balances for XPower tokens")
  .addParam("token", "para, aqch or qrsh", "para")
  .setAction(async (args, hre) => {
    const symbol = Token.symbol(args.token || "para");
    assert(typeof symbol === "string", "token is not a string");
    const accounts = await hre.ethers.getSigners();
    assert(accounts.length > 0, "missing accounts");
    const xpower = await Token.contract(symbol);
    assert(xpower, "missing contract");
    for (const { address } of accounts) {
      const balance = await xpower.balanceOf(address);
      console.log(`${address} => ${balance.toString()} ${symbol}`);
    }
  });

/**
 * Mine (and mint) for XPower tokens
 */
task("mine", "Mines for XPower tokens")
  .addParam("cache", "cache block-hash", "true")
  .addParam("json", "json logs", "false")
  .addParam("level", "minimum minting threshold level", "5")
  .addParam("mint", "auto-mint if possible", "true")
  .addParam("refresh", "refresh block-hash", "false")
  .addParam("token", "para, aqch or qrsh", "para")
  .addParam("workers", "number of mining processes", `${workers()}`)
  .setAction(async (args, hre) => {
    const address = process.env.MINT_ADDRESS;
    assert(address, "missing MINT_ADDRESS");
    const cache = JSON.parse(args.cache || "true");
    assert(typeof cache === "boolean", "cache is not a boolean");
    const json = JSON.parse(args.json || "false");
    assert(typeof json === "boolean", "cache is not a boolean");
    const level = JSON.parse(args.level || "1");
    assert(typeof level === "number", "level is not a number");
    assert(level > 0, "level is not larger than zero");
    const mint = JSON.parse(args.mint || "true");
    assert(typeof mint === "boolean", "mint is not a boolean");
    const refresh = JSON.parse(args.refresh || "false");
    assert(typeof refresh === "boolean", "refresh is not a boolean");
    const symbol = Token.symbol(args.token || "para");
    assert(typeof symbol === "string", "token is not a string");
    const n_workers = JSON.parse(args.workers || `${workers()}`);
    assert(typeof n_workers === "number", "workers is not a number");
    assert(n_workers > 0, "workers is not larger than zero");
    await start(symbol, address, {
      cache,
      json,
      level,
      mint,
      refresh,
      n_workers,
    });
  });

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
      url: "http://127.0.0.1:9650/ext/bc/C/rpc",
      chainId: 43112,
      accounts: [
        process.env.MINT_ADDRESS_PK ||
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
      chainId: 43113,
      accounts: [
        process.env.MINT_ADDRESS_PK ||
          "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    },
    /* avalanche */ mainnet: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: [
        process.env.MINT_ADDRESS_PK ||
          "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};
