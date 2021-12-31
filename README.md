# XPower Token (XPOW)

The XPower token family &mdash; with XPOW as its symbol prefix &mdash; are proof-of-work tokens, that can only be minted by providing a correct nonce (with a recent block-hash). The XPOW-CPU, XPOW-GPU and XPOW-ASIC tokens are part of the same family with a maximum supply of 817.356B × 10^64 XPOW-CPU, 878.779 billion &times; 10^64 XPOW-GPU and 1'024.398T × 10^64 XPOW-ASIC tokens. To be exact:

The maximum supply of XPOW-CPU tokens is

> 8173559240281143206369716588848558201407293035221686873373476518205632680466;

the maximum supply of XPOW-GPU tokens is

> 8787792486760604116967440826552207292435668479088792806564000920878366851072;

and the maximum supply of XPOW-ASIC tokens is

> 10243981394713817163879045579987358347893978955888388649865763135200064687833090.

## Installation

```shell
npm install
```

## Help

```shell
npx hardhat help
```

## Tasks

### List accounts

```shell
npx hardhat accounts
```

## Development

### Clean

```shell
npx hardhat clean [--global]
```

### ESLint

```shell
npx eslint '**/*.js' [--fix|--quiet]
```

### Prettier

```shell
npx prettier '**/*.{json,sol,md}' [--check|--write]
```

### Solhint

```shell
npx solhint 'contracts/**/*.sol' [--fix|--quiet]
```

### Compile

```shell
npx hardhat compile [--force|--quiet]
```

## Testing

```shell
[REPORT_GAS=1] npx hardhat test [--no-compile] [...test-files]
```

```shell
npx hardhat coverage [...test-files]
```

## Deployment

### Start a local node

```shell
npx hardhat node
```

..which can be skipped, if another EVM compatible chain is available. In such a case, ensure to add the `--network $NETWORK` argument below. Possible networks are:

- Hardhat's `hardhat` network (for development and testing &mdash; default),
- Avalanche's `local` network (requires an `avalanchego` instance),
- Avalanche's `fuji` network (for development and testing),
- Avalache's `mainnet` network,

..where the configuration details of each network can be found in `hardhat.config.js`.

### Deploy smart contract(s)

```shell
npx hardhat run 'scripts/deploy.js' [--no-compile] [--network $NETWORK]
```

```shell
npx hardhat run 'scripts/deploy-nfts-v1.js' [--no-compile] [--network $NETWORK]
```

```shell
npx hardhat run 'scripts/deploy-nfts-v2.js' [--no-compile] [--network $NETWORK]
```

## Mining & Minting

XPOW tokens can be mined and minted at [xpowermine.com](https://www.xpowermine.com/home), but you can also use the **terminal** to do so. First, download the contract's source code from the link, unpack the archive and then follow the instructions below:

> https://github.com/xpowermine/xpower-hh/archive/refs/heads/main.zip

### Installation & Build

```shell
npm install && npm run build
```

### Environment Variables

```shell
cp .env-main .env
```

..plus change in `.env` the `MINER_ADDRESS` to _your own_ one; don't forget add the corresponding *private key* too:

```shell
MINER_ADDRESS=0x...    # use your own address (for mining purposes)
```
```shell
MINER_ADDRESS_PK=0x... # use the private key of the same address!
```

> Please, do **NOT** provide an address with a private key that contains massive amounts of AVAX! This account will _only_ be used to auto-pay for some minting fees. Just ensure, that there is enough &mdash; which you can afford to loose &mdash; but not more. Metamask users can for example add a new account, transfer a _small_ amount of AVAX to it, and then export the private key from the account's details section.

### Mining and Minting:

```shell
npx hardhat mine --network mainnet
    [--token cpu|gpu|asic]  # token to mine (default: cpu)
    [--level 5]             # threshold level (default: 5)
    [--mint true|false]     # mint (default: true)
    [--cache true|false]    # cache block-hash (default: true)
    [--refresh false|true]  # refresh block-hash (default: false)
    [--workers N]           # number of workers (default: #CPUs - 1)
```

```
[MINT#1] nonce = 0xeebd6e3f8e8e4f37d051d1de0b985cc1d7e7bb1bdf47b709236ae585329f3093 => 2 XPOW.CPU [100.000 H/ms]
[MINT#2] nonce = 0x3ad5505c118cd1994c379b961dd19a0001b7c38792109303a560ce07da91b24b => 1 XPOW.CPU [099.000 H/ms]
[MINT#3] nonce = 0xfe2db5d91a9949c1213f70f7942bc9bb02097ce8e27e27b6d8db54de56a4c288 => 1 XPOW.CPU [101.000 H/ms]
[MINT#1] nonce = 0x01fb1cec82deb1229c96268e9679c7fa08e88de2cdf14b9d5a7b07d42aecf617 => 1 XPOW.CPU [100.000 H/ms]
...
```

..where you should observe the `[MINT]` prefix if mining and minting of the `nonce` has been successful, and where you should see the `amount` of XPOW tokens that have been minted on the right hand side. With the `token` option you can choose, which token you want to mine and mint for: possible values are `cpu`, `gpu` and `asic`. Further, to ignore lower valued amounts, you can use the `level` option:

```shell
npx hardhat mine --network mainnet --token cpu --level 3
```

```
[MINT#1] nonce = 0x6f83302e4144d648d129cd0f6baa6bf66bd967f5eb2a94c27ca724648e79fff5 => 1 XPOW.CPU [100.000 H/ms]
[MINT#2] nonce = 0xb83f064fa8b16532023fcc4ae83c3f3c678440bb8f0e5516ac8239412cec5c81 => 1 XPOW.CPU [099.000 H/ms]
[MINT#3] nonce = 0xe0c678c7644eb974b8b0d8d75be677ed4c8047443d7aa364a6a3738b4d3b2343 => 2 XPOW.CPU [101.000 H/ms]
[MINT#1] nonce = 0x93061dedf91e79d5cb5b7cef0f597e5a3a2ecbcb14a480b4e17c2f4b9ab39242 => 1 XPOW.CPU [100.000 H/ms]
...
```

..where you can stop mining with `CTRL+C`.

### XPOW and AVAX Balances

```shell
npx hardhat balances-xpow --network mainnet [--token cpu|gpu|asic]
```

..which lists all present accounts with XPOW balances.

```shell
npx hardhat balances-avax --network mainnet
```

..which lists all present accounts with nano-AVAX balances.

## Copyright

 © 2021 [XPowerMine.com](https://www.xpowermine.com)
