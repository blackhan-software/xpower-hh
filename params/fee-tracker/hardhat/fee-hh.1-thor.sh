#!/usr/bin/env bash

for LOG in ./runs.1-thor/*.log ; do
    cat "$LOG" | grep "XPowerThorTest" | grep "mint" | grep -oP "[0-9]{5,6}" | tr '\n' ' ' ; echo ;
done
