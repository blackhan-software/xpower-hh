#!/bin/bash
#######################################################################
# shellcheck disable=SC2086,SC2155

#######################################################################
# Start cron (to restart each hour):

/usr/sbin/cron

#######################################################################
# MINT_ADDRESS=0x..

if [ -z "$MINT_ADDRESS" ] ; then
    SECRET_PATH="/var/run/secrets/xpower-mint-address"
    if [ -f "$SECRET_PATH" ] ; then
        export MINT_ADDRESS="$(cat $SECRET_PATH)"
    else
        echo "MINT_ADDRESS missing"
        exit 1
    fi
fi

#######################################################################
# MINT_ADDRESS_PK=0x..

if [ -z "$MINT_ADDRESS_PK" ] ; then
    SECRET_PATH="/var/run/secrets/xpower-mint-address-pk"
    if [ -f "$SECRET_PATH" ] ; then
        export MINT_ADDRESS_PK="$(cat $SECRET_PATH)"
    else
        echo "MINT_ADDRESS_PK missing"
        exit 1
    fi
fi

#######################################################################
# MINT_LEVEL=6

if [ -z "$MINT_LEVEL" ] ; then
    export MINT_LEVEL=6
fi

#######################################################################
# MINE_WORKERS=3

if [ -z "$MINE_WORKERS" ] ; then
    export MINE_WORKERS=3
fi

#######################################################################
# Start miner (and restart on error):

while true ; do
    /usr/local/bin/npx hardhat mine \
        --cache true \
        --json true \
        --mint true \
        --mint-level "$MINT_LEVEL" \
        --workers "$MINE_WORKERS" \
        --network mainnet
done

#######################################################################
#######################################################################
