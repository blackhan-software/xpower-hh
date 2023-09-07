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

def graph(args):
    data = np.genfromtxt(open(args.path).readlines())
    ms = data[:,0]
    ys = data[:,1]

    ms_rates = inflation(ms, prefix='[M]')
    ys_rates = inflation(ys, prefix='[Y]')

    # Plot yearly and monthy rewards:
    ax1 = pp.subplot(221)
    pp.title('APOW Rewards over Years', fontweight='bold')
    pp.plot(ys, 'r.')
    pp.plot(ys, 'r:')
    pp.ylabel('Rewards [×1\'000]')
    pp.legend(['Yearly Rewards'])
    pp.grid()
    ax2 = pp.subplot(222)
    pp.title('APOW Rewards over Months', fontweight='bold')
    pp.plot(ms, 'g.')
    pp.plot(ms, 'g:')
    pp.legend(['Monthly Rewards'])
    pp.grid()

    # Plot yearly and monthy inflation:
    pp.subplot(223, sharex=ax1)
    pp.plot(ys_rates, 'r.')
    pp.plot(ys_rates, 'r:')
    pp.xlabel('Years')
    pp.ylabel('Inflation Rate [%]')
    pp.legend(['Yearly Inflation'])
    pp.grid()
    pp.subplot(224, sharex=ax2)
    pp.plot(ms_rates, 'g.')
    pp.plot(ms_rates, 'g:')
    pp.xlabel('Months')
    pp.legend(['Monthly Inflation'])
    pp.grid()

    pp.show()

###############################################################################
###############################################################################

if __name__ == '__main__':

    parser = argparse.ArgumentParser(
        description='Plots Rewards over Time')
    parser.add_argument('path', type=str, nargs='?',
        help='path to data (default: %(default)s)', default='./rewards.txt')

    args = parser.parse_args()
    graph(args)

###############################################################################
###############################################################################
