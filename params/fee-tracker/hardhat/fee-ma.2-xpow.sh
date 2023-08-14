#!/usr/bin/env bash

for LOG in ./runs.2-xpow/*.log ; do
    cat "$LOG" | grep "FEE" | tail -1 | sed 's/\[FEE\] //g' ;
done
