#!/usr/bin/env -S ipython --matplotlib=auto

#%%
import matplotlib.pyplot as pp
import numpy as np
import os

path = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(path, 'apr+of.2.txt')
data = np.genfromtxt(path)
tgts = data[:,2] / 20
aprs = data[:,1] / 20
idxs = data[:,0]
ones = np.ones(data.shape[0])

pp.semilogy(idxs, tgts, color='black')
pp.semilogy(idxs, aprs, color='black', linestyle='--')
pp.fill_between(idxs, tgts, aprs, where=tgts>=0, color='r', alpha=0.5)
pp.fill_between(idxs, aprs, ones, where=aprs>=0, color='b', alpha=0.5)

pp.title('APR Bonus Reparametrization', fontweight='bold')
pp.legend(['APR Bonus target (log)', 'APR Bonus value (log)'])
pp.ylabel('Multiple')
pp.xlabel('Months')
pp.grid()

#%%
if __name__ == '__main__':
    pp.show(block=True)
