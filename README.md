[![Main](https://github.com/blackhan-software/xpower-hh/actions/workflows/main.yaml/badge.svg)](https://github.com/blackhan-software/xpower-hh/actions/workflows/main.yaml)

# XPower Token

XPower is a proof-of-work token, i.e. it can only be minted by providing a correct nonce (with a recent block-hash). It has a maximum supply of 0.856T × 10^64 XPOW. To be exact, the maximum supply of the XPOW token is:

> 8559756508734743772394349710289740556191203711430480235769479063523433370898.923520

## Installation

```sh
npm install
```

## Help

```sh
npx hardhat help
```

## Tasks

### List accounts

```sh
npx hardhat accounts
```

## Development

### Clean

```sh
npx hardhat clean [--global]
```

### ESLint

```sh
npx eslint '**/*.js' [--fix|--quiet]
```

### Prettier

```sh
npx prettier '**/*.{json,md}' [--check|--write]
```

### Solhint

```sh
npx solhint 'contracts/**/*.sol' [--fix|--quiet]
```

### Compile

```sh
npx hardhat compile [--force|--quiet]
```

## Testing

```sh
[REPORT_GAS=1] npx hardhat test [--no-compile] [...test-files]
```

```sh
npx hardhat coverage [...test-files]
```

## Deployment

### Start a localhost node

```sh
npx hardhat node
```

..which can be skipped, if another EVM compatible chain is available. In such a case, ensure to add the `--network $NETWORK` argument below. Possible networks are:

- Hardhat's `hardhat` (for development and testing &mdash; default),
- Hardhat's `localhost` (for development and testing &mdash; use with `hardhat node`),
- Avalanche's `local` (requires an `avalanchego` instance),
- Avalanche's `fuji` (for development and testing),
- Avalache's `mainnet`,

..where the configuration details of each network can be found in `hardhat.config.js`.

### Deploy smart contract(s)

```sh
npx hardhat run 'scripts/deploy.js' [--no-compile] [--network $NETWORK]
```

## Mining & Minting

XPower tokens can be mined and minted at [xpowermine.com](https://www.xpowermine.com/home), but you can also use a _terminal_ based miner to do so. First, download the source code from this link, unpack the archive and then follow the instructions below:

> https://github.com/xpowermine/xpower-hh/archive/refs/heads/main.zip

### Installation & Build

```sh
npm install && npm run build
```

### Environment Variables

```sh
cp .env-avalanche-main .env
```

..plus change in `.env` the `MINT_ADDRESS` to _your own_ one; don't forget to set the corresponding `MINT_ADDRESS_PK` _private key_ too. It's also possible to use the private key of a _different_ address: That way the account of the beneficiary and the minting fee payer can be &mdash; for security purposes &mdash; separated.

```sh
MINT_ADDRESS=0x...    # beneficiary address (account to *receive* minted tokens)
```

```sh
MINT_ADDRESS_PK=0x... # minter address' private key (can be a different account)
```

> Please, do **NOT** provide an address with a private key that contains massive amounts of AVAX! This account will _only_ be used to auto-pay for some minting fees. Just ensure that there is enough &mdash; which you can afford to loose &mdash; but not more. Metamask users can for example add a new account, transfer a _small_ amount of AVAX to it, and then export the private key from the account's details section.

### Mining and Minting:

```sh
Usage: hardhat [GLOBAL OPTIONS] mine [--cache <BOOLEAN>] [--json <BOOLEAN>] [--level <INT>] [--mint <BOOLEAN>] [--nonce-bytes <INT>] [--refresh <BOOLEAN>] [--workers <INT>] [...tokens]

OPTIONS:

  --cache       cache block-hash (default: true)
  --json        json logs (default: false)
  --level       minimum minting threshold (default: 6)
  --mint        auto-mint if possible (default: true)
  --nonce-bytes number of nonce bytes (default: 8)
  --refresh     refresh block-hash (default: false)
  --workers     number of mining processes (default: CPUs - 1)

POSITIONAL ARGUMENTS:

  tokens        xpow (default: ["xpow"])

mine: Mines for XPower tokens
```

Start mining and minting on the Avalanche mainnet for the XPower XPOW tokens (and optionally filter for the `info` messages only &mdash; requires the `jq` tool):

```sh
npx hardhat mine --network mainnet # | jq -rc 'select(.level=="info")|.message'
```

```txt
[INIT#0|ACK] block-hash=0x569...ade, timestamp=1651775584 => XPOW
```

```txt
[MINT#2|ACK] nonce=0x981...08d, block_hash=0x569...ade => 63 XPOW [279.289 H/ms]
...
```

..where you should see the `[MINT]` prefix, if minting for the `nonce` value has been successful. Further, to skip minting _lower_ valued amounts you can use the `level` option:

```sh
npx hardhat mine --network mainnet --level 7 # | jq -rc '.message'
```

```txt
[MINT#2|ACK] nonce=0x626...3c4, block_hash=0x699...09d => 127 XPOW [609.415 H/ms]
...
```

..where you can stop mining with `CTRL+C`.

### XPower and AVAX Balances

```sh
npx hardhat balances-xpow --network mainnet
```

..which lists all present accounts with XPower balances.

```sh
npx hardhat balances-avax --network mainnet
```

..which lists all present accounts with nano-AVAX balances.

## Systemd Integration

### Service installation

> By default the service files assume the miner (repository) to be accessible at `/opt/xpower-hh`. If that is not the case, either provide a corresponding symbolic link or (if you cannot access `/opt`) modify the service files accordingly.

Copy the systemd unit files to the user directory:

```sh
cp --update ./services/* ~/.config/systemd/user/
```

Enable the timer service (for e.g. `level=7`):

```sh
systemctl enable --user xpow-miner@7.timer
```

..to ensure that mining starts upon a reboot (optional).

### Service start

Start the timer service (to auto-[re]start &ndash; every hour &ndash; the miner service):

```sh
systemctl start --user xpow-miner@7.timer
```

List the installed timer services:

```sh
systemctl list-timers --user
```

Follow the journal of the miner service:

```sh
journalctl --user -fu xpow-miner@7.service
```

### Service stop

Stop the timer service:

```sh
systemctl stop --user xpow-miner@7.timer
```

Stop the miner service:

```sh
systemctl stop --user xpow-miner@7.service
```

### Service removal

Disable the timer service:

```sh
systemctl disable --user xpow-miner@7.timer
```

..to ensure that mining does _not_ start upon a reboot.

## Docker Integration

Build docker image:

```sh
docker build -t xpower-hh .
```

Set minting address and private-key (can also be for a different address):

```sh
export MINT_ADDRESS=0x..
export MINT_ADDRESS_PK=0x..
```

Run docker image to start mining:

```sh
docker run -ti -e MINT_ADDRESS="$MINT_ADDRESS" -e MINT_ADDRESS_PK="$MINT_ADDRESS_PK" -e MINE_LEVEL=7 -e MINE_WORKERS=3 xpower-hh
```

## Copyright

© 2023 [Blackhan Software Ltd](https://www.linkedin.com/company/blackhan)
