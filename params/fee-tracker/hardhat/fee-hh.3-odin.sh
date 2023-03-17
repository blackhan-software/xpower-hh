#!/usr/bin/env bash

for LOG in ./runs.3-odin/*.log ; do
    cat "$LOG" | grep "XPowerOdinTest" | grep "mint" | grep -oP "[0-9]{5,6}" | tr '\n' ' ' ; echo ;
done
