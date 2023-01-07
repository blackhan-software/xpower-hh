// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

struct Polynomial {
    uint256[] array;
}

library Polynomials {
    /**
     * @return value evaluated with (value+[5-4])*[3/2]+[1-0]
     *
     * Evaluates a `value` using a linear function -- defined by
     * the provided polynomial coefficients.
     */
    function eval(Polynomial memory p, uint256 value) internal pure returns (uint256) {
        uint256 delta = sub(value + p.array[5], p.array[4]);
        uint256 ratio = div(delta * p.array[3], p.array[2]);
        return sub(ratio + p.array[1], p.array[0]);
    }

    /**
     * @return value evaluated with (value+[5-4])*[3/2]+[1-0]
     *
     * Evaluates a `value` using a linear function -- defined by
     * the provided polynomial coefficients. Negative underflows
     * are avoided by clamping at `0`. Further, division-by-zero
     * panics are prevented by clamping at `type(uint256).max`.
     */
    function evalClamped(Polynomial memory p, uint256 value) internal pure returns (uint256) {
        uint256 delta = subClamped(value + p.array[5], p.array[4]);
        uint256 ratio = divClamped(delta * p.array[3], p.array[2]);
        return subClamped(ratio + p.array[1], p.array[0]);
    }

    function sub(uint256 lhs, uint256 rhs) private pure returns (uint256) {
        return lhs - rhs; // allow less-than-0 error
    }

    function subClamped(uint256 lhs, uint256 rhs) private pure returns (uint256) {
        return lhs > rhs ? lhs - rhs : 0; // avoid less-than-0 error
    }

    function div(uint256 lhs, uint256 rhs) private pure returns (uint256) {
        return lhs / rhs; // allow div-by-0 error
    }

    function divClamped(uint256 lhs, uint256 rhs) private pure returns (uint256) {
        return rhs > 0 ? lhs / rhs : type(uint256).max; // avoid div-by-0 error
    }
}
