// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import {Constants} from "../libs/Constants.sol";

/**
 * @title Rug pull protection
 */
library Rpp {
    /** validate params: w.r.t. Polynomial.eval3 */
    function checkArray(uint256[] memory array) internal pure {
        require(array.length == 3, "invalid array.length");
        // eliminate possibility of division-by-zero
        require(array[1] > 0, "invalid array[1] == 0");
        // eliminate possibility of all-zero values
        require(array[2] > 0, "invalid array[2] == 0");
    }

    /** validate change: 0.5 <= next / last <= 2.0 or next <= unit */
    function checkValue(uint256 nextValue, uint256 lastValue) internal pure {
        if (nextValue < lastValue) {
            require(lastValue <= 2 * nextValue, "invalid change: too small");
        }
        if (nextValue > lastValue && lastValue > 0) {
            require(nextValue <= 2 * lastValue, "invalid change: too large");
        }
        if (nextValue > lastValue && lastValue == 0) {
            require(nextValue <= 10 ** Constants.DECIMALS, "invalid change: too large");
        }
    }

    /** validate change: invocation frequency at most once per month */
    function checkStamp(uint256 nextStamp, uint256 lastStamp) internal pure {
        if (lastStamp > 0) {
            require(nextStamp - lastStamp > Constants.MONTH, "invalid change: too frequent");
        }
    }
}
