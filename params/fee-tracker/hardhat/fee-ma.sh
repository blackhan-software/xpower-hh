#!/usr/bin/env bash

for LOG in $(ls *.log) ; do
    cat "$LOG" | grep "FEE" | tail -1 | sed 's/\[FEE\] //g' ;
done
