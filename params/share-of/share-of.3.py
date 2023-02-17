#!/usr/bin/env -S ipython --matplotlib=auto

#%%
import matplotlib.pyplot as pp
import numpy as np
import os

path = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(path, 'share-of.3.txt')
data = np.genfromtxt(path)
tgts = data[:,2] / 500000000000000000
aprs = data[:,1] / 500000000000000000
idxs = data[:,0] / 4
zero = np.zeros(data.shape[0])

pp.plot(idxs, tgts, color='black')
pp.plot(idxs, aprs, color='black', linestyle='--')
pp.fill_between(idxs, tgts, aprs, where=tgts>=0, color='r', alpha=0.5)
pp.fill_between(idxs, aprs, where=aprs>=0, color='b', alpha=0.5)

pp.title('Treasury Share Reparametrization', fontweight='bold')
pp.legend(['Treasury Share target', 'Treasury Share value'])
pp.ylabel('Multiple')
pp.xlabel('Months')
pp.grid()

#%%
if __name__ == '__main__':
    pp.show(block=True)
