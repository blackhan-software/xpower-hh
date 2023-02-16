// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

library Interpolator {
    /** @return interpolate linearly v=t*(v1-v0)/(t1-t0) with v in [v0, v1] */
    function linear(uint256 t0, uint256 v0, uint256 t1, uint256 v1, uint256 t) internal pure returns (uint256) {
        require(t1 >= t0, "invalid timeline");
        if (t <= t0 || t0 == t1) {
            return v0;
        }
        if (t >= t1) {
            return v1;
        }
        uint256 dt = t1 - t0;
        assert(dt > 0);
        if (v1 > v0) {
            return (dt * v0 + (t - t0) * (v1 - v0)) / dt;
        }
        if (v0 > v1) {
            return (dt * v0 - (t - t0) * (v0 - v1)) / dt;
        }
        return v0;
    }
}
