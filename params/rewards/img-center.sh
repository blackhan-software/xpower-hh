#!/usr/bin/env bash
###############################################################################

function cli_help {
    echo "${BB}Usage:${NB} $0 [OPTIONS] image1.png [image2.jpg ...]"
    echo ""
    echo "Options:"
    echo "  -b|--background COLOR    Set the background color (default: white)"
    echo "  -h                       Show this help message"
    echo ""
}

function cli {
    while getopts ":b:h-:" OPTION "$@"; do
        if [ "$OPTION" = "-" ]; then
            OPTION="${OPTARG%%=*}"
            OPTARG="${OPTARG#$OPTION}"
            OPTARG="${OPTARG#=}"
        fi
        case "$OPTION" in
        b | background)
            BG="$OPTARG"
            ;;
        h | help)
            cli_help
            exit 0
            ;;
        *)
            cli_help
            exit 1
            ;;
        esac
    done
    if [ -z "$BG" ]; then
        BG="white"
    fi
    # Remove the options processed
    shift $((OPTIND - 1))
    # Need for remaining arguments
    if [ "$#" -lt 1 ]; then
        cli_help
        exit 1
    fi
    # Pass the remaining arguments
    ARGS=$@
}

###############################################################################

function main {
    # Get the largest width and height among all provided image files
    local w=$(identify -format '%w\n' "$@" | sort -n | tail -1)
    local h=$(identify -format '%h\n' "$@" | sort -n | tail -1)
    # Pad images to match largest dimensions, while centering content
    for img in "$@"; do
        local cmd="convert \"$img\""
        cmd+=" -background $BG"
        cmd+=" -gravity center"
        cmd+=" -extent ${w}x${h}"
        cmd+=" \"$img\""
        echo $cmd
        eval $cmd
    done
}

###############################################################################

cli "$@" && main $ARGS

###############################################################################
###############################################################################
