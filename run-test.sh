#!/usr/bin/env bash

TEST_FILE="$1"
DATA_PATH="$2"
RUNS_INIT="$3"
RUNS_DONE="$4"

if [ -z "$DATA_PATH" ] ; then
    DATA_PATH="/tmp"
fi

if [ -z "$RUNS_INIT" ] ; then
    RUNS_INIT="1"
fi

if [ -z "$RUNS_DONE" ] ; then
    RUNS_DONE="$RUNS_INIT"
    RUNS_INIT="1"
fi

for RUN in $(seq -f "%04g" "$RUNS_INIT" "$RUNS_DONE") ; do
    echo ; echo -n "> RUN=$RUN" ;
    (time RUNS=$RUN npm run -- test "$TEST_FILE") \
    | tee "$DATA_PATH/$RUN.log" ;
done
