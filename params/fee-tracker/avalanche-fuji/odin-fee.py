#!/usr/bin/env -S ipython --matplotlib=auto

#%%
import matplotlib.pyplot as pp
import numpy as np
import os

base = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(base, 'odin-fee.log')
data = np.genfromtxt(path)

fee = data[:,0]
avg = data[:,1]

pp.subplot(211)
pp.title('XPower Minting Fees [FUJI]', fontweight='bold')
pp.ylabel('Fees [AVAX.1E-18]')

pp.plot(fee, 'r-.')
pp.plot(avg, 'b-.')
pp.legend(['Measured fees', 'Estimated fees'])
pp.grid()

pp.subplot(212)
pp.xticks([], [])
pp.xlabel('Mints')
pp.ylabel('Ratio')

pp.plot(fee / avg, 'g-.')
pp.legend(['Measured / Estimated fees'])
pp.ylim(0.6, 1.2)
pp.grid()

#%%
if __name__ == '__main__':
    pp.show(block=True)
