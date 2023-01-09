#!/usr/bin/env -S ipython --matplotlib=auto

#%%
import matplotlib.pyplot as pp
import numpy as np
import os

path = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(path, 'nft-rates.csv')
data = np.genfromtxt(path, delimiter=',')[2:]

year = data[:, 0]
unit = data[:, 6]
kilo = data[:,12]
mega = data[:,18]
giga = data[:,24]
tera = data[:,30]
peta = data[:,36]
ones = np.ones(len(year))

pp.semilogy(year, peta, color='black', linestyle='solid')
pp.semilogy(year, tera, color='black', linestyle='dashdot')
pp.semilogy(year, giga, color='black', linestyle='dashed')
pp.semilogy(year, mega, color='black', linestyle=(0, (3, 2, 1, 2)))
pp.semilogy(year, kilo, color='black', linestyle='dotted')

pp.fill_between(year, peta, tera, color='red', alpha=0.2)
pp.fill_between(year, tera, giga, color='red', alpha=0.4)
pp.fill_between(year, giga, mega, color='red', alpha=0.6)
pp.fill_between(year, mega, kilo, color='red', alpha=0.8)
pp.fill_between(year, kilo, ones, color='red', alpha=1.0)

pp.title('ROI on XPower NFTs', fontweight='bold')
pp.legend(['Peta NFT', 'Tera NFT', 'Giga NFT', 'Mega NFT', 'Kilo NFT'])
pp.xticks([0, 10, 20, 30, 40], map(str, [0, 10, 20, 30, 40]))
pp.yticks([1, 2, 4, 6, 8, 10], map(str, [1, 2, 4, 6, 8, 10]))
pp.ylabel('Multiple [XPower]')
pp.xlabel('Years')
pp.grid()


#%%
if __name__ == '__main__':
    pp.show(block=True)
