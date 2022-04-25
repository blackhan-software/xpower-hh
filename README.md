# XPower Tokens

The XPower token family are proof-of-work tokens, that can only be minted by providing a correct nonce (with a recent block-hash). The THOR, LOKI and ODIN tokens are part of the same family with a maximum supply of 817.356B × 10^64 THOR, 878.779 billion &times; 10^64 LOKI and 1'024.398T × 10^64 ODIN tokens. To be exact:

The maximum supply of THOR tokens is

> 8173559240281143206369716588848558201407293035221686873373476518205632680466;

the maximum supply of LOKI tokens is

> 8787792486760604116967440826552207292435668479088792806564000920878366851072;

and the maximum supply of ODIN tokens is

> 10243981394713817163879045579987358347893978955888388649865763135200064687833090.

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
npx prettier '**/*.{json,sol,md}' [--check|--write]
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

### Start a local node

```sh
npx hardhat node
```

..which can be skipped, if another EVM compatible chain is available. In such a case, ensure to add the `--network $NETWORK` argument below. Possible networks are:

- Hardhat's `hardhat` network (for development and testing &mdash; default),
- Avalanche's `local` network (requires an `avalanchego` instance),
- Avalanche's `fuji` network (for development and testing),
- Avalache's `mainnet` network,

..where the configuration details of each network can be found in `hardhat.config.js`.

### Deploy smart contract(s)

```sh
npx hardhat run 'scripts/deploy.js' [--no-compile] [--network $NETWORK]
```

## Mining & Minting

XPower tokens can be mined and minted at [xpowermine.com](https://www.xpowermine.com/home), but you can also use a *terminal* based miner to do so. First, download the source code from this link, unpack the archive and then follow the instructions below:

> https://github.com/xpowermine/xpower-hh/archive/refs/heads/main.zip

### Installation & Build

```sh
npm install && npm run build
```

### Environment Variables

```sh
cp .env-main .env
```

..plus change in `.env` the `MINT_ADDRESS` to _your own_ one; don't forget to set the corresponding `MINT_ADDRESS_PK` _private key_ too. It's also possible to use the private key of a *different* address: That way the account of the beneficiary and the minting fee payer can be &mdash; for security purposes &mdash; separated.

```sh
MINT_ADDRESS=0x...    # beneficiary address (account to *receive* minted tokens)
```

```sh
MINT_ADDRESS_PK=0x... # minter address' private key (can be a different account)
```

> Please, do **NOT** provide an address with a private key that contains massive amounts of AVAX! This account will _only_ be used to auto-pay for some minting fees. Just ensure that there is enough &mdash; which you can afford to loose &mdash; but not more. Metamask users can for example add a new account, transfer a _small_ amount of AVAX to it, and then export the private key from the account's details section.

### Mining and Minting:

```sh
Usage: hardhat [GLOBAL OPTIONS] mine [--cache <BOOLEAN>] [--json <BOOLEAN>] [--level <INT>] [--mint <BOOLEAN>] [--refresh <BOOLEAN>] [--workers <INT>] [...tokens]

OPTIONS:

  --cache       cache block-hash (default: true)
  --json        json logs (default: false)
  --level       minimum minting threshold (default: 7)
  --mint        auto-mint if possible (default: true)
  --refresh     refresh block-hash (default: false)
  --workers     number of mining processes (default: CPUs - 1)

POSITIONAL ARGUMENTS:

  tokens        thor, loki or odin (default: ["thor","loki","odin"])

mine: Mines for XPower tokens
```

Start mining and minting on the Avalanche mainnet for the XPower THOR, LOKI and ODIN tokens (and optionally filter for the `info` messages only &mdash; requires the `jq` tool):

```sh
npx hardhat mine --network mainnet # | jq -rc 'select(.level=="info")|.message'
```

```txt
[INIT#0|ACK] block-hash=0xe3f...920, timestamp=1651775580 => THOR
[INIT#0|ACK] block-hash=0x569...ade, timestamp=1651775584 => LOKI
[INIT#0|ACK] block-hash=0xb7a...f4d, timestamp=1651775588 => ODIN
```

```txt
[MINT#4|ACK] nonce=0x80a...531, block_hash=0xe3f...920 =>       5 THOR [096.468 H/ms]
[MINT#2|ACK] nonce=0x981...08d, block_hash=0x569...ade =>      31 LOKI [120.812 H/ms]
[MINT#3|ACK] nonce=0xa69...d6e, block_hash=0xb7a...f4d => 1048575 ODIN [121.778 H/ms]
...
```

..where you should see the `[MINT]` prefix, if minting for the `nonce` value has been successful. Via the positional `tokens` arguments you can also choose which token(s) you want to mine and mint for: `thor`, `loki` or `odin`. Further, to skip minting *lower* valued amounts you can use the `level` option:

```sh
npx hardhat mine --network mainnet --level 7 thor # | jq -rc '.message'
```

```txt
[MINT#3|ACK] nonce=0xbb9...9b8, block_hash=0x699...09d => 7 THOR [104.973 H/ms]
[MINT#1|ACK] nonce=0x557...cfd, block_hash=0x699...09d => 8 THOR [120.621 H/ms]
[MINT#2|ACK] nonce=0x626...3c4, block_hash=0x699...09d => 7 THOR [119.361 H/ms]
...
```

..where you can stop mining with `CTRL+C`.

### XPower and AVAX Balances

```sh
npx hardhat balances-xpow --network mainnet [thor|loki|odin]
```

..which lists all present accounts with XPower balances.

```sh
npx hardhat balances-avax --network mainnet
```

..which lists all present accounts with nano-AVAX balances.

## Systemd Integration

The examples below are specific to mine (and mint) *all* the XPower THOR, LOKI and ODIN tokens simultaneously (across multiple CPU cores). If you want to mine them individually, then you have to replace the `xpow-` prefix with the `thor-`, `loki-` or `odin-` prefixes respectively.

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

..to ensure that mining does *not* start upon a reboot.

## Copyright

 © 2022 [XPowerMine.com](https://www.xpowermine.com)
