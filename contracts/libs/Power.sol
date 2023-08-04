// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

library Power {
    /**
     * @return n raised to the power of (exp/[root>0])
     */
    // function raised(uint256 n, uint256 exp, uint256 root) internal pure returns (uint256) {
    //     return Math.exp(1) ** ((Math.ln(n) * exp) / root);
    // }

    /**
     * @return n raised to the power of (exp/[root=8])
     */
    function raised(uint256 n, uint256 exp) internal pure returns (uint256) {
        (uint256 integer, uint256 fraction) = (exp / 8, exp % 8);
        return n ** integer * _sqrt2(_eighth(n ** 2, fraction));
    }

    function _eighth(uint256 n, uint256 exp) private pure returns (uint256) {
        if (exp < 4) {
            if (exp < 2) {
                if (exp == 0) {
                    return 1;
                } else {
                    return _sqrt8(n);
                }
            } else {
                if (exp == 2) {
                    return _sqrt4(n);
                } else {
                    return _sqrt84(n);
                }
            }
        } else {
            if (exp < 6) {
                if (exp == 4) {
                    return _sqrt2(n);
                } else {
                    return _sqrt82(n);
                }
            } else {
                if (exp == 6) {
                    return _sqrt42(n);
                } else {
                    return _sqrt842(n);
                }
            }
        }
    }

    function _sqrt2(uint256 s1) private pure returns (uint256) {
        uint256 s2 = Math.sqrt(s1, Math.Rounding.Up);
        return s2;
    }

    function _sqrt4(uint256 s1) private pure returns (uint256) {
        uint256 s2 = Math.sqrt(s1, Math.Rounding.Up);
        uint256 s4 = Math.sqrt(s2, Math.Rounding.Up);
        return s4;
    }

    function _sqrt8(uint256 s1) private pure returns (uint256) {
        uint256 s2 = Math.sqrt(s1, Math.Rounding.Up);
        uint256 s4 = Math.sqrt(s2, Math.Rounding.Up);
        uint256 s8 = Math.sqrt(s4, Math.Rounding.Up);
        return s8;
    }

    function _sqrt42(uint256 s1) private pure returns (uint256) {
        uint256 s2 = Math.sqrt(s1, Math.Rounding.Up);
        uint256 s4 = Math.sqrt(s2, Math.Rounding.Up);
        return s4 * s2;
    }

    function _sqrt82(uint256 s1) private pure returns (uint256) {
        uint256 s2 = Math.sqrt(s1, Math.Rounding.Up);
        uint256 s4 = Math.sqrt(s2, Math.Rounding.Up);
        uint256 s8 = Math.sqrt(s4, Math.Rounding.Up);
        return s8 * s2;
    }

    function _sqrt84(uint256 s1) private pure returns (uint256) {
        uint256 s2 = Math.sqrt(s1, Math.Rounding.Up);
        uint256 s4 = Math.sqrt(s2, Math.Rounding.Up);
        uint256 s8 = Math.sqrt(s4, Math.Rounding.Up);
        return s8 * s4;
    }

    function _sqrt842(uint256 s1) private pure returns (uint256) {
        uint256 s2 = Math.sqrt(s1, Math.Rounding.Up);
        uint256 s4 = Math.sqrt(s2, Math.Rounding.Up);
        uint256 s8 = Math.sqrt(s4, Math.Rounding.Up);
        return s8 * s4 * s2;
    }
}
