#!/usr/bin/env python
###############################################################################
"""
The script is designed to visualize data in a 3D scatter plot, using data from
either a default or user-specified input file.  Within the plot,  the *x-axis*
represents the 'Average Reward Rate',  the *y-axis* showcases the 'Progression
Exponent',  and the *z-axis* displays 'Δ-GINI' values,  with data point colors
determined by the 'Δ-GINI' values.
"""

import argparse

import matplotlib.cm as cm
import matplotlib.colors as colors
import matplotlib.pyplot as pp
import numpy as np

###############################################################################
###############################################################################

def graph(args: argparse.Namespace):
    # Read data into array
    data = open(args.path).readlines()
    data = np.genfromtxt(filter(full_groups, data))

    # Subsample data
    if args.subsample > 1:
        mask = np.arange(0, len(data), args.subsample)
        data = data[mask, :]

    # Map data to arrays
    rates, expos = data.T[0], data.T[1]
    shape, scale = data.T[2], data.T[3]
    ginis = data.T[-1]

    # Array masks by [min, max]-ranges
    mask1 = (rates >= args.rates_min) & (rates <= args.rates_max)
    mask2 = (expos >= args.expos_min) & (expos <= args.expos_max)
    mask3 = (shape >= args.shape_min) & (shape <= args.shape_max)
    mask4 = (scale >= args.scale_min) & (scale <= args.scale_max)
    mask5 = (ginis >= args.ginis_min) & (ginis <= args.ginis_max)

    # Filter arrays by masks
    rates = rates[mask1 & mask2 & mask3 & mask4 & mask5]
    expos = expos[mask1 & mask2 & mask3 & mask4 & mask5]
    shape = shape[mask1 & mask2 & mask3 & mask4 & mask5]
    scale = scale[mask1 & mask2 & mask3 & mask4 & mask5]
    ginis = ginis[mask1 & mask2 & mask3 & mask4 & mask5]

    # Data selection
    x_data, x_name = select(
        [rates, expos, shape, scale, ginis], args.x_axis)
    y_data, y_name = select(
        [rates, expos, shape, scale, ginis], args.y_axis)
    z_data, z_name = select(
        [rates, expos, shape, scale, ginis], args.z_axis)

    # 3D scatter plot
    ax = pp.subplot(111, projection='3d')
    cs = pp.get_cmap(args.color_map)
    ax.scatter(x_data, y_data, 100 * z_data, c=100 * z_data, cmap=cs)
    ax.view_init(elev=args.angle_elevation, azim=args.angle_azimuth)

    title_lhs = f'shape=[{args.shape_min}:{args.shape_max}]'
    title_rhs = f'scale=[{args.scale_min}:{args.scale_max}]'
    title = f'GINI Reduction over Pareto({title_lhs}, {title_rhs})'
    ax.set_title(title, fontweight='bold')
    ax.set_xlabel(x_name)
    ax.set_ylabel(y_name)
    ax.set_zlabel(z_name)
    
    # GINI Colorbar
    if args.z_axis == -1: # default
        min, max = nearest_pct(z_data.min(), 5), nearest_pct(z_data.max(), 5)
        ls = np.linspace(min, max, int((max - min) / 5) + 1)
    else:
        ls = np.linspace(z_data.min(), z_data.max())
    if len(ls) > 1:
        bn = colors.BoundaryNorm(ls, cs.N, extend='both')
        cb = pp.colorbar(cm.ScalarMappable(norm=bn, cmap=cs), ax=ax)
        cb.set_label(z_name)

    ax.grid()
    pp.show()

###############################################################################

def full_groups(line: str):
    """Returns whether line has non-empty groups"""
    return '0.000000e+00' not in line

def select(arrays: list[np.array], index: int):
    """Returns array selected by index with its name"""
    if index == 0:
        return arrays[0], 'Average Reward Rate [%]'
    if index == 1:
        return arrays[1], 'Progression Exponent'
    if index == 2:
        return arrays[2], 'Pareto Shape'
    if index == 3:
        return arrays[3], 'Pareto Scale'

    return arrays[-1], 'Δ-GINI [%]'

def nearest_pct(n: float, step: float):
    """Returns nearest percent value w.r.t. step"""
    return round(100 * n / step) * step

###############################################################################
###############################################################################

if __name__ == '__main__':

    parser = argparse.ArgumentParser(
        description='Plots a graph')
    parser.add_argument('path', type=str, nargs='?',
        help='path to data (default: %(default)s)', default='logs/REAS.SS.log')

    # Average reward rate (ARR) & Progression exponent (PE)
    parser.add_argument('-r', '--rates-min', type=float,
        help='rates-min (default: %(default)s)', default=0.0)
    parser.add_argument('-R', '--rates-max', type=float,
        help='rates-max (default: %(default)s)', default=10.0)
    parser.add_argument('-e', '--expos-min', type=float,
        help='expos-min (default: %(default)s)', default=1.0)
    parser.add_argument('-E', '--expos-max', type=float,
        help='expos-max (default: %(default)s)', default=2.0)

    # Pareto(shape, scale)
    parser.add_argument('-a', '--shape-min', type=float,
        help='shape-min (default: %(default)s)', default=1.05)
    parser.add_argument('-A', '--shape-max', type=float,
        help='shape-max (default: %(default)s)', default=1.95)
    parser.add_argument('-s', '--scale-min', type=float,
        help='scale-min (default: %(default)s)', default=0.05)
    parser.add_argument('-S', '--scale-max', type=float,
        help='scale-max (default: %(default)s)', default=0.95)

    # GINI coefficient
    parser.add_argument('-g', '--ginis-min', type=float,
        help='ginis-min (default: %(default)s)', default=-1.0)
    parser.add_argument('-G', '--ginis-max', type=float,
        help='ginis-max (default: %(default)s)', default=+1.0)

    # Data selection
    parser.add_argument('-X', '--x-axis', type=int,
        help='x-axis (default: %(default)s [ARR])', default=0)
    parser.add_argument('-Y', '--y-axis', type=int,
        help='y-axis (default: %(default)s [PE])', default=1)
    parser.add_argument('-Z', '--z-axis', type=int,
        help='z-axis (default: %(default)s [GINI])', default=-1)

    # Data sampling & Color map
    parser.add_argument('-z', '--subsample', type=int,
        help='subsample (default: %(default)s)', default=1)
    parser.add_argument('-c', '--color-map', type=str,
        help='color-map (default: %(default)s)', default='viridis')

    # View angle
    parser.add_argument('-azim', '--angle-azimuth', type=float,
        help='angle azimuth (default: %(default)s)', default=60)
    parser.add_argument('-elev', '--angle-elevation', type=float,
        help='angle elevation (default: %(default)s)', default=30)

    args = parser.parse_args()
    graph(args)

###############################################################################
###############################################################################
