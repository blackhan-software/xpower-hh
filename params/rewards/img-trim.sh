#!/usr/bin/env bash
###############################################################################

function cli_help {
    echo "${BB}Usage:${NB} $0 [OPTIONS] image1.png [image2.jpg ...]"
    echo ""
    echo "Options:"
    echo "  -b|--background COLOR    Set the background color (default: white)"
    echo "  -p|--pad PADDING         Set the border padding (default: 10x10)"
    echo "  -h                       Show this help message"
    echo ""
}

function cli {
    while getopts ":b:p:h-:" OPTION; do
        if [ "$OPTION" = "-" ]; then
            OPTION="${OPTARG%%=*}"
            OPTARG="${OPTARG#$OPTION}"
            OPTARG="${OPTARG#=}"
        fi
        case $OPTION in
        b | background)
            BG="$OPTARG"
            ;;
        p | pad)
            BP="$OPTARG"
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
    if [ -z "$BP" ]; then
        BP="10x10"
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
    # Trim each image and add a minimum padding
    for img in "$@"; do
        local cmd="convert \"$img\""
        cmd+=" -trim +repage"
        cmd+=" -background $BG"
        cmd+=" -bordercolor $BG"
        cmd+=" -border $BP"
        cmd+=" \"$img\""
        echo $cmd
        eval $cmd
    done
}

###############################################################################

cli "$@" && main $ARGS

###############################################################################
###############################################################################
