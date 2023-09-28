const { task, types } = require("hardhat/config");
const assert = require("assert");
require("dotenv").config();

require("@nomicfoundation/hardhat-toolbox");
const { Token, format } = require("./source/token");
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
  async (args, { ethers }) => {
    const accounts = await ethers.getSigners();
    assert(accounts.length > 0, "missing accounts");
    for (const { address } of accounts) {
      const balance = await ethers.provider.getBalance(address);
      console.log(`${address}: ${format(balance)} AVAX`);
    }
  },
);

/**
 * List balances of accounts for XPower tokens
 */
task("balances-xpow", "Prints the list of balances for XPower tokens")
  .addVariadicPositionalParam("tokens", "xpow", ["xpow"], types.string, true)
  .setAction(async (args, { ethers }) => {
    const accounts = await ethers.getSigners();
    assert(accounts.length > 0, "missing accounts");
    const symbols = Array.from(
      new Set(args.tokens.map((token) => Token.symbol(token))),
    );
    for (const symbol of symbols) {
      const xpower = await Token.contract(symbol);
      const base = 10n ** (await xpower.decimals());
      for (const { address } of accounts) {
        const balance = Number(await xpower.balanceOf(address));
        console.log(`${address}: ${format(balance, base)} ${symbol}`);
      }
    }
  });

/**
 * Mine (and mint) for XPower tokens
 */
task("mine", "Mines for XPower tokens")
  .addParam("cache", "cache block-hash", true, types.boolean)
  .addParam("json", "json logs", false, types.boolean)
  .addParam("mint", "auto-mint if possible", true, types.boolean)
  .addParam("mintLevel", "minimum minting threshold", 6, types.int)
  .addParam("nonceBytes", "number of nonce bytes", 8, types.int)
  .addParam("refresh", "refresh block-hash", false, types.boolean)
  .addParam("workers", "number of mining processes", workers(), types.int)
  .addVariadicPositionalParam("tokens", "xpow", ["xpow"], types.string, true)
  .setAction(async (args, { ethers }) => {
    const accounts = await ethers.getSigners();
    assert(accounts.length > 0, "missing accounts");
    const beneficiary = process.env.MINT_ADDRESS;
    assert(beneficiary, "missing MINT_ADDRESS");
    assert(args.mintLevel > 0, "level is not larger than zero");
    assert(args.workers > 0, "workers is not larger than zero");
    const symbols = args.tokens.map((token) => Token.symbol(token));
    return start(symbols, [accounts[0].address, beneficiary], {
      cache: args.cache,
      json: args.json,
      level: args.mintLevel,
      mint: args.mint,
      nonce_length: args.nonceBytes,
      n_workers: args.workers,
      refresh: args.refresh,
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
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: Boolean(process.env.OPTIMIZER_FLAG || 1),
        runs: Number(process.env.OPTIMIZER_RUNS || 200),
      },
    },
  },
  networks: {
    /* avalanche */ hardhat: {
      allowBlocksWithSameTimestamp: Boolean(process.env.NO_TIMETRAVEL),
      blockGasLimit: 15_000_000,
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
      gasMultiplier: 1.0, // gasPrice: 100_000_000_000,
    },
    /* avalanche */ fuji: {
      url:
        process.env.AVAX_TESTNET_RPC ||
        "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [
        process.env.MINT_ADDRESS_PK ||
          "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
      gasMultiplier: 1.0, // gasPrice: 100_000_000_000,
    },
    /* avalanche */ mainnet: {
      url:
        process.env.AVAX_MAINNET_RPC || "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: [
        process.env.MINT_ADDRESS_PK ||
          "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
      gasMultiplier: 1.0, // gasPrice: 100_000_000_000,
    },
  },
  etherscan: {
    apiKey: {
      avalancheFujiTestnet: process.env.ETHERSCAN_API_KEY || "",
      avalanche: process.env.ETHERSCAN_API_KEY || "",
    },
    url: "https://api.snowtrace.io/api",
  },
  gasReporter: {
    gasPriceApi:
      "https://api.snowtrace.io/api?module=proxy&action=eth_gasPrice",
    enabled: process.env.REPORT_GAS !== undefined,
    coinmarketcap: process.env.CMCC_API_KEY,
    currency: "USD",
    token: "AVAX",
  },
};
