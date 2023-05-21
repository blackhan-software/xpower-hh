// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import {Interpolator} from "../libs/Interpolator.sol";

contract InterpolatorTest {
    function linear(uint256 t0, uint256 v0, uint256 t1, uint256 v1, uint256 t) public pure returns (uint256) {
        return Interpolator.linear(t0, v0, t1, v1, t);
    }
}
