#!/usr/bin/env bash

for LOG in ./runs.1-thor/*.log ; do
    cat "$LOG" | grep "FEE" | tail -1 | sed 's/\[FEE\] //g' ;
done
