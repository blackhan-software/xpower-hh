#!/usr/bin/env python
###############################################################################

import argparse
import numpy as np
import matplotlib.pyplot as pp

###############################################################################
###############################################################################

def simulate(args):
    """
    Returns long-term means over sums of Pareto distributed claims
    """
    claims = np.random.pareto(args.shape, args.length)
    dtimes = np.arange(1, args.length + 1)
    totals = claims.cumsum()

    return totals / dtimes

###############################################################################
###############################################################################

if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description='Plots Long-Term Means')
    parser.add_argument('-R', '--runs', type=int,
        help='simulation runs (default: %(default)s)', default=1000)
    parser.add_argument('-l', '--length', type=int,
        help='sample length (default: %(default)s)', default=1000)
    parser.add_argument('-s', '--shape', type=float,
        help='pareto shape (default: %(default)s)', default=1.25)
    parser.add_argument('-a', '--alpha', type=float,
        help='plot opacity (default: %(default)s)', default=0.01)
    parser.add_argument('-f', '--format', type=str,
        help='plot format (default: %(default)s)', default='g:')

    args = parser.parse_args()
    for run in range(args.runs):
        data = simulate(args)
        mean, std = data.mean(), data.std()
        print(run, 'mean={:.2f}'.format(mean), 'std={:.2f}'.format(std))
        pp.semilogy(data, args.format, alpha=args.alpha)

    title = f"Means: Cumulative Sums of Pareto(shape={args.shape}) Distributed Claims / Duration"
    pp.title(title, fontweight="bold")
    pp.xlabel("Duration")
    pp.ylabel("Means")
    pp.grid()
    pp.show()

###############################################################################
###############################################################################
