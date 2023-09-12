#!/usr/bin/env python
###############################################################################

import argparse
import numpy as np
import matplotlib.pyplot as pp

###############################################################################
###############################################################################

def inflation(rewards, prefix):

    mean, std, sum = rewards.mean(), rewards.std(), rewards.sum()
    print(prefix, 'mean={:05.1f} std={:.1f} sum={:07.1f}'
          .format(mean, std, sum))

    total = rewards.cumsum()
    roll1 = np.roll(total, shift=1)
    roll1[0] = roll1[1] / 10.999
    rates = (total / roll1) - 1

    for r, rt, rr in zip(rewards, total, rates * 100):
        print(f'{r:05.1f}', f'{rt:07.1f}', f'{rr:05.1f}%')

    rates[0] = np.inf
    return rates * 100

def graph(args, column, color):
    data = np.genfromtxt(open(args.path).readlines())
    ms = data[:,2*column+0]
    ys = data[:,2*column+1]

    ms_rates = inflation(ms, prefix='[M]')
    ys_rates = inflation(ys, prefix='[Y]')

    # Plot annual rewards (yearly claims):
    ax1 = pp.subplot(221)
    pp.title('APOW Rewards with Yearly Claims', fontweight='bold')
    pp.plot(ys, ':.', color=color)
    pp.ylabel('Rewards [×1E6]')
    label = lambda y: f'Annual Rewards [×({y} years+dT)/dT]'
    pp.legend(list(map(label, [0,1,2,3,4,5,9,99])))
    pp.grid(visible=True)

    # Plot annual rewards (monthy claims):
    ax2 = pp.subplot(222, sharey=ax1)
    pp.title('APOW Rewards with Monthly Claims', fontweight='bold')
    pp.plot(ms, ':.', color=color)
    label = lambda y: f'Annual Rewards [×({y} years+dT)/dT]'
    pp.legend(list(map(label, [0,1,2,3,4,5,9,99])))
    # pp.legend(['Annual Rewards'])
    pp.grid(visible=True)

    # Plot annual inflation (yearly claims):
    ax3 = pp.subplot(223, sharex=ax1)
    pp.plot(ys_rates, ':.', color=color)
    pp.xlabel('Years')
    pp.ylabel('Inflation Rate [%]')
    label = lambda y: f'Annual Inflation [×({y} years+dT)/dT]'
    pp.legend(list(map(label, [0,1,2,3,4,5,9,99])))
    pp.grid(visible=True)

    # Plot annual inflation (monthly claims):
    pp.subplot(224, sharex=ax2, sharey=ax3)
    pp.plot(ms_rates, ':.', color=color)
    pp.xlabel('Years')
    label = lambda y: f'Annual Inflation [×({y} years+dT)/dT]'
    pp.legend(list(map(label, [0,1,2,3,4,5,9,99])))
    pp.grid(visible=True)

###############################################################################
###############################################################################

if __name__ == '__main__':

    parser = argparse.ArgumentParser(
        description='Plots Rewards over Time')
    parser.add_argument('path', type=str, nargs='?',
        help='path to data (default: %(default)s)', default='./rewards.txt')

    args = parser.parse_args()
    graph(args, column=0, color='r')
    graph(args, column=1, color='g')
    graph(args, column=2, color='b')

    graph(args, column=3, color='c')
    graph(args, column=4, color='m')
    graph(args, column=5, color='y')

    # graph(args, column=6, color='black') # (09+dT)/dT
    # graph(args, column=7, color='black') # (99+dT)/dT
    pp.show()

###############################################################################
###############################################################################
