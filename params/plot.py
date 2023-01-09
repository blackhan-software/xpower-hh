#!/usr/bin/env -S ipython --matplotlib=auto
###############################################################################

import argparse
import numpy as np
import matplotlib.pyplot as pp

###############################################################################
###############################################################################

def graph(
    path: str,
    title: str,
    xlabel: str,
    ylabel: str,
    begin: int,
    end: int | None,
    scale: float,
    grid: bool,
    semilogx: bool,
    semilogy: bool,
    colors: list,
    markers: list,
):
    data = np.genfromtxt(open(path).readlines())
    rows, cols = data.shape
    if not end: end = rows

    if semilogx and semilogy:
        plot = pp.loglog
    elif semilogx:
        plot = pp.semilogx
    elif semilogy:
        plot = pp.semilogy
    else:
        plot = pp.plot

    for i in range(0, cols - 1):
        xs, yi = data[:,0], data[:,i+1]
        yi = yi / scale if scale else yi / yi[0]
        color = colors[i] if i < len(colors) else None
        marker = markers[i] if i < len(markers) else None
        plot(xs[begin:end], yi[begin:end], color=color)
        plot(xs[begin:end], yi[begin:end], color=color, marker=marker)

    if title != None:
        pp.title(title, fontweight="bold")
    if xlabel != None:
        pp.xlabel("Months")
    if ylabel != None:
        pp.ylabel("Multiple")
    if grid:
        pp.grid()

    pp.show()

###############################################################################
###############################################################################

if __name__ == '__main__':

    parser = argparse.ArgumentParser(
        description='Plots a graph')
    parser.add_argument('path', type=str, nargs='?',
        help='path to data (default: %(default)s)', default=None)
    parser.add_argument('-t', '--title', type=str,
        help='title (default: %(default)s)', default=None)
    parser.add_argument('-x', '--xlabel', type=str,
        help='xlabel (default: %(default)s)', default=None)
    parser.add_argument('-y', '--ylabel', type=str,
        help='ylabel (default: %(default)s)', default=None)
    parser.add_argument('-b', '--begin', type=int,
        help='begin (default: %(default)s)', default=0)
    parser.add_argument('-e', '--end', type=int,
        help='end (default: %(default)s)', default=None)
    parser.add_argument('-s', '--scale', type=float,
        help='scale (default: %(default)s)', default=None)
    parser.add_argument('-G', '--no-grid', action='store_true',
        help='grid (default: %(default)s)', default=False)
    parser.add_argument('-X', '--semilogx', action='store_true',
        help='semilogx (default: %(default)s)', default=False)
    parser.add_argument('-Y', '--semilogy', action='store_true',
        help='semilogy (default: %(default)s)', default=False)
    parser.add_argument('-c', '--colors', type=str,
        help='colors (default: %(default)s)', default="brgmcy")
    parser.add_argument('-m', '--markers', type=str,
        help='colors (default: %(default)s)', default="......")

    args = parser.parse_args()
    graph(
        args.path,
        begin=args.begin,
        end=args.end,
        grid=not args.no_grid,
        scale=args.scale,
        title=args.title,
        xlabel=args.xlabel,
        ylabel=args.ylabel,
        semilogx=args.semilogx,
        semilogy=args.semilogy,
        colors=list(args.colors),
        markers=list(args.markers),
    )

###############################################################################
###############################################################################
