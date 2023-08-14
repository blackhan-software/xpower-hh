#!/usr/bin/env bash

for LOG in ./runs.2-xpow/*.log ; do
    cat "$LOG" | grep "XPowerLokiTest" | grep "mint" | grep -oP "[0-9]{5,6}" | tr '\n' ' ' ; echo ;
done
