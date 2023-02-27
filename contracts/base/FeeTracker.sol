// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

/**
 * Allows tracking of fees using cumulative moving-averages:
 * >
 * > avg[n+1] = (fee[n+1] + n*avg[n]) / (n+1)
 * >
 */
abstract contract FeeTracker {
    /** cumulative moving-averages: gas & gas-price */
    uint256[2] private _average;
    /** cumulative moving-averages: overhead ~ 1.52 */
    uint256 private constant MUL = 1_522815194170197;
    uint256 private constant DIV = 1_000000000000000;

    /** gas & gas-price tracker */
    modifier tracked() {
        uint256 gas = gasleft();
        _;
        _update(gas - gasleft(), tx.gasprice);
    }

    /** @return fee-estimate and averages over gas & gas-price */
    function fees() public view returns (uint256[] memory) {
        uint256[] memory array = new uint256[](3);
        uint256 gasPrice = _average[1];
        array[2] = gasPrice;
        uint256 gasValue = _average[0];
        array[1] = gasValue;
        uint256 feeValue = gasPrice * gasValue;
        array[0] = (MUL * feeValue) / DIV;
        return array;
    }

    /** update averages over gas & gas-price */
    function _update(uint256 gasValue, uint256 gasPrice) private {
        uint256 value = _average[0];
        if (value > 0) {
            _average[0] = (gasValue + value * 0xf) >> 4;
        } else {
            _average[0] = (gasValue);
        }
        uint256 price = _average[1];
        if (price > 0) {
            _average[1] = (gasPrice + price * 0xf) >> 4;
        } else {
            _average[1] = (gasPrice);
        }
    }
}
