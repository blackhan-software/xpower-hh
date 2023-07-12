#!/usr/bin/env bash
###############################################################################
# CMD_SCRIPT=$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)
###############################################################################

function cli_help {
    local usage
    usage="${BB}Usage:${NB}"
    usage+=" [-r|--rate-lhs=\${RATE_LHS-0.125}]"
    usage+=" [-i|--rate-inc=\${RATE_INC-0.125}]"
    usage+=" [-R|--rate-rhs=\${RATE_RHS-10.000}]"
    usage+=" [-e|--expo-lhs=\${EXPO_LHS-0.125}]"
    usage+=" [-j|--expo-inc=\${EXPO_INC-0.125}]"
    usage+=" [-E|--expo-rhs=\${EXPO_RHS-2.000}]"
    usage+=" [-a|--alpha-lhs=\${ALPHA_LHS-1.05}]"
    usage+=" [-k|--alpha-inc=\${ALPHA_INC-0.05}]"
    usage+=" [-A|--alpha-rhs=\${ALPHA_RHS-1.95}]"
    usage+=" [-m|--scale-lhs=\${SCALE_LHS-1.05}]"
    usage+=" [-l|--scale-inc=\${SCALE_INC-0.05}]"
    usage+=" [-M|--scale-rhs=\${SCALE_RHS-1.95}]"
    usage+=" [-S|--seed=\$SEED|--seed=\$RANDOM]"
    usage+=" [-h|--help]"
    printf '%s\n' "$usage"
}

function cli_options {
    local -a options
    options+=("-r" "--rate-lhs=")
    options+=("-i" "--rate-inc=")
    options+=("-R" "--rate-rhs=")
    options+=("-e" "--expo-lhs=")
    options+=("-j" "--expo-inc=")
    options+=("-E" "--expo-rhs=")
    options+=("-a" "--alpha-lhs=")
    options+=("-k" "--alpha-inc=")
    options+=("-A" "--alpha-rhs=")
    options+=("-m" "--scale-lhs=")
    options+=("-l" "--scale-inc=")
    options+=("-M" "--scale-rhs=")
    options+=("-S" "--seed=")
    options+=("-h" "--help")
    printf '%s ' "${options[@]}"
}

function cli {
    while getopts ":hr:i:R:e:j:E:a:k:A:m:l:M:S:-:" OPT "$@"; do
        if [ "$OPT" = "-" ]; then
            OPT="${OPTARG%%=*}"
            OPTARG="${OPTARG#$OPT}"
            OPTARG="${OPTARG#=}"
        fi
        case "${OPT}" in
        list-options)
            cli_options && exit 0
            ;;
        r | rate-lhs)
            RATE_LHS="${OPTARG}"
            ;;
        i | rate-inc)
            RATE_INC="${OPTARG}"
            ;;
        R | rate-rhs)
            RATE_RHS="${OPTARG}"
            ;;
        e | expo-lhs)
            EXPO_LHS="${OPTARG}"
            ;;
        j | expo-inc)
            EXPO_INC="${OPTARG}"
            ;;
        E | expo-rhs)
            EXPO_RHS="${OPTARG}"
            ;;
        a | alpha-lhs)
            ALPHA_LHS="${OPTARG}"
            ;;
        k | alpha-inc)
            ALPHA_INC="${OPTARG}"
            ;;
        A | alpha-rhs)
            ALPHA_RHS="${OPTARG}"
            ;;
        m | scale-lhs)
            SCALE_LHS="${OPTARG}"
            ;;
        l | scale-inc)
            SCALE_INC="${OPTARG}"
            ;;
        M | scale-rhs)
            SCALE_RHS="${OPTARG}"
            ;;
        S | seed)
            SEED="${OPTARG}"
            ;;
        h | help)
            cli_help && exit 0
            ;;
        : | *)
            cli_help && exit 1
            ;;
        esac
    done
    if [ -z "$RATE_LHS" ]; then
        RATE_LHS="0.125"
    fi
    if [ -z "$RATE_INC" ]; then
        RATE_INC="0.125"
    fi
    if [ -z "$RATE_RHS" ]; then
        RATE_RHS="10.000"
    fi
    if [ -z "$EXPO_LHS" ]; then
        EXPO_LHS="0.125"
    fi
    if [ -z "$EXPO_INC" ]; then
        EXPO_INC="0.125"
    fi
    if [ -z "$EXPO_RHS" ]; then
        EXPO_RHS="2.000"
    fi
    if [ -z "$ALPHA_LHS" ]; then
        ALPHA_LHS="1.05"
    fi
    if [ -z "$ALPHA_INC" ]; then
        ALPHA_INC="0.05"
    fi
    if [ -z "$ALPHA_RHS" ]; then
        ALPHA_RHS="1.95"
    fi
    if [ -z "$SCALE_LHS" ]; then
        SCALE_LHS="0.05"
    fi
    if [ -z "$SCALE_INC" ]; then
        SCALE_INC="0.05"
    fi
    if [ -z "$SCALE_RHS" ]; then
        SCALE_RHS="0.95"
    fi
    shift $((OPTIND - 1))
}

###############################################################################

function main {
    for RATE in $(seq "$RATE_LHS" "$RATE_INC" "$RATE_RHS"); do
        for EXP0 in $(seq "$EXPO_LHS" "$EXPO_INC" "$EXPO_RHS"); do
            for ALPHA in $(seq "$ALPHA_LHS" "$ALPHA_INC" "$ALPHA_RHS"); do
                for SCALE in $(seq "$SCALE_LHS" "$SCALE_INC" "$SCALE_RHS"); do

                    echo -n "$RATE $EXP0 $ALPHA $SCALE " ;
                    ./simulator.py \
                        --seed="${SEED-$RANDOM}" \
                        --rate "$RATE" --expo "$EXP0" \
                        --alpha "$ALPHA" --scale "$SCALE" \
                        --print-ginis --skip-plots ;

                    test $? -eq 0 || exit 1 ;
                done
            done
        done
    done
}

###############################################################################

cli "$@" && main ;

###############################################################################
###############################################################################
