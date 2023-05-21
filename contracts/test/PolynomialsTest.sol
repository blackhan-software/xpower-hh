// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import {Polynomials} from "../libs/Polynomials.sol";
import {Polynomial} from "../libs/Polynomials.sol";

contract PolynomialsTest {
    function eval6(Polynomial memory p, uint256 value) public pure returns (uint256) {
        return Polynomials.eval6(p, value);
    }

    function eval4(Polynomial memory p, uint256 value) public pure returns (uint256) {
        return Polynomials.eval4(p, value);
    }

    function eval6Clamped(Polynomial memory p, uint256 value) public pure returns (uint256) {
        return Polynomials.eval6Clamped(p, value);
    }

    function eval4Clamped(Polynomial memory p, uint256 value) public pure returns (uint256) {
        return Polynomials.eval4Clamped(p, value);
    }
}
