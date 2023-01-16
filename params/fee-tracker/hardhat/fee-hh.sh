#!/usr/bin/env bash

for LOG in $(ls *.log) ; do
    cat "$LOG" | grep "XPowerThorTest" | grep "mint" | grep -oP "[0-9]{6}" | tr '\n' ' ' ; echo ;
done
