// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import {Power} from "./Power.sol";

struct Polynomial {
    uint256[] array;
}

library Polynomials {
    /**
     * @return value evaluated with {(value+[5-4])*[3/2]+[1-0]}^[6]
     *
     * Evaluates a `value` using a linear function -- defined by
     * the provided polynomial coefficients.
     */
    function eval6(Polynomial memory p, uint256 value) internal pure returns (uint256) {
        uint256 delta = sub(value + p.array[5], p.array[4]);
        uint256 ratio = div(delta * p.array[3], p.array[2]);
        uint256 shift = sub(ratio + p.array[1], p.array[0]);
        return Power.raised(shift, p.array[6]);
    }

    /**
     * @return value evaluated with {(value+[4-3])*[2/1]+[0]}^[5]
     *
     * Evaluates a `value` using a linear function -- defined by
     * the provided polynomial coefficients.
     */
    function eval5(Polynomial memory p, uint256 value) internal pure returns (uint256) {
        uint256 delta = sub(value + p.array[4], p.array[3]);
        uint256 ratio = div(delta * p.array[2], p.array[1]);
        return Power.raised(ratio + p.array[0], p.array[5]);
    }

    /**
     * @return value evaluated with {(value)*[3/2]+[1-0]}^[4]
     *
     * Evaluates a `value` using a linear function -- defined by
     * the provided polynomial coefficients.
     */
    function eval4(Polynomial memory p, uint256 value) internal pure returns (uint256) {
        uint256 ratio = div(value * p.array[3], p.array[2]);
        uint256 shift = sub(ratio + p.array[1], p.array[0]);
        return Power.raised(shift, p.array[4]);
    }

    /**
     * @return value evaluated with {(value)*[2/1]+[0]}^[3]
     *
     * Evaluates a `value` using a linear function -- defined by
     * the provided polynomial coefficients.
     */
    function eval3(Polynomial memory p, uint256 value) internal pure returns (uint256) {
        uint256 ratio = div(value * p.array[2], p.array[1]);
        return Power.raised(ratio + p.array[0], p.array[3]);
    }

    /**
     * @return value evaluated with {(value+[5-4])*[3/2]+[1-0]}^[6]
     *
     * Evaluates a `value` using a linear function -- defined by
     * the provided polynomial coefficients. Negative underflows
     * are avoided by clamping at `0`. Further, division-by-zero
     * panics are prevented by clamping at `type(uint256).max`.
     */
    function eval6Clamped(Polynomial memory p, uint256 value) internal pure returns (uint256) {
        uint256 delta = subClamped(value + p.array[5], p.array[4]);
        uint256 ratio = divClamped(delta * p.array[3], p.array[2]);
        uint256 shift = subClamped(ratio + p.array[1], p.array[0]);
        return Power.raised(shift, p.array[6]);
    }

    /**
     * @return value evaluated with {(value+[4-3])*[2/1]+[0]}^[5]
     *
     * Evaluates a `value` using a linear function -- defined by
     * the provided polynomial coefficients. And division-by-zero
     * panics are prevented by clamping at `type(uint256).max`.
     */
    function eval5Clamped(Polynomial memory p, uint256 value) internal pure returns (uint256) {
        uint256 delta = subClamped(value + p.array[4], p.array[3]);
        uint256 ratio = divClamped(delta * p.array[2], p.array[1]);
        return Power.raised(ratio + p.array[0], p.array[5]);
    }

    /**
     * @return value evaluated with {(value)*[3/2]+[1-0]}^[4]
     *
     * Evaluates a `value` using a linear function -- defined by
     * the provided polynomial coefficients. Negative underflows
     * are avoided by clamping at `0`. Further, division-by-zero
     * panics are prevented by clamping at `type(uint256).max`.
     */
    function eval4Clamped(Polynomial memory p, uint256 value) internal pure returns (uint256) {
        uint256 ratio = divClamped(value * p.array[3], p.array[2]);
        uint256 shift = subClamped(ratio + p.array[1], p.array[0]);
        return Power.raised(shift, p.array[4]);
    }

    /**
     * @return value evaluated with {(value)*[2/1]+[0]}^[3]
     *
     * Evaluates a `value` using a linear function -- defined by
     * the provided polynomial coefficients. And division-by-zero
     * panics are prevented by clamping at `type(uint256).max`.
     */
    function eval3Clamped(Polynomial memory p, uint256 value) internal pure returns (uint256) {
        uint256 ratio = divClamped(value * p.array[2], p.array[1]);
        return Power.raised(ratio + p.array[0], p.array[3]);
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
