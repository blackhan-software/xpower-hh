# XPower Token (XPOW)

The XPower token &mdash; with XPOW as its symbol &mdash; is a proof-of-work token, that can only be minted by providing a proof-of-work nonce. It's fixed cap with a maximum supply of about 878.779 billion &times; 10^64 XPOW tokens; to be exact:

> 8787792486760604116967440826552207292435668479088792806564000920878366851072 XPOW

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

### ..or deploy smart contract(s) via

```shell
node scripts/deploy.js [--no-compile] [--network $NETWORK]
```

## Mining & Minting

XPOW tokens can be mined and minted at [xpowermine.com](https://www.xpowermine.com/home), but you can also use the **terminal** to do so. First, download the contract's source code from the link, unpack the archive and then follow the instructions below:

> https://github.com/karun-i-sfarda/xpower-hh/archive/refs/heads/main.zip

### Installation

```shell
npm install
```

### Environment Variables

```shell
cp .env-main .env
```

..plus change in `.env` the `MINER_ADDRESS` to _your own_ one:

```shell
MINER_ADDRESS=0x... # use your own address!
```

### Private Key (for Minting Fees)

In `hardhat.config.js` add a private key to the `accounts` list, which has been pre-filled with some AVAX to pay for minting fees:

```js
/* avalanche */ mainnet: {
    url: "https://api.avax.network/ext/bc/C/rpc",
    gasPrice: 225000000000,
    chainId: 43114,
    accounts: [
        "0x..." // provide a *private key*
    ],
},
```

> Please, do **NOT** provide a private key that contains massive amounts of AVAX! This account will _only_ be used to auto-pay for some minting fees. Just ensure, that there is enough &mdash; which you can afford to loose &mdash; but not more. Metamask users can for example add a new account, transfer a _small_ amount of AVAX to it, and then export the private key from the account's details section.

### Mining and Minting:

```shell
npx hardhat mine --network mainnet --mint true
```

```
[MINT] nonce = 0xac7f3e5c61295a59078b24c6a355c148d48d11061f9325f87e6bbea8a5ac3144 => 1 XPOW
[MINT] nonce = 0x35d7b597ea30494c8ae23e0e097ad917fa4e4d030468cbcd74cd52fe18f2244b => 3 XPOW
[MINT] nonce = 0xcc24af8987b8bdbd96bf75ab0fef61fa2b846166b62004ed09c7ec60631fbcbf => 1 XPOW
[MINT] nonce = 0xb4664c014e633fd86df7e36e186ef18228b630c01322146cf6ec551b0880188e => 1 XPOW
...
```

..where you should observe the `[MINT]` prefix if mining and minting of the `nonce` has been successful, and where you should see the `amount` of XPOW tokens that have been minted on the right hand side. To ignore lower valued amounts, you can use the `threshold` option:

```shell
npx hardhat mine --network mainnet --mint true --threshold 3
```

```
[MINT] nonce = 0x8eef3e19c3ea635bb1bc0bad2fcf5a45b3d82074e83ad8665179da4d6390bbef => 3 XPOW
[MINT] nonce = 0x9402f538e12a5372352a5b89c8b9a2cc3c411c3a44de820fde434869d57e5202 => 7 XPOW
[MINT] nonce = 0xef1734a92b6d17fb86d2b3f474bb6f38ae83297ea32e273face1caf61dee02ba => 3 XPOW
[MINT] nonce = 0xebc31a9e485efd6b258fe4fc05635c095592b4ebf8f0ca59de0849f8eb99b03c => 3 XPOW
...
```

..where you can stop mining with `CTRL+C`.

### XPOW and AVAX Balances

```shell
npx hardhat balances-xpow --network mainnet
```

..which lists all present accounts with XPOW balances.

```shell
npx hardhat balances-avax --network mainnet
```

..which lists all present accounts with nano-AVAX balances.

## Copyright

© 2021 [Kârūn The Lydian](https://github.com/karun-i-sfarda)
