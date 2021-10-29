// solhint-disable no-empty-blocks
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;
import "./XPower.sol";

/** Test class exposing internal methods of XPower */
contract XPowerTest is XPower {
    constructor() XPower() {}

    function hash(
        uint256 _nonce,
        address _sender,
        uint256 _interval
    ) public pure returns (bytes32) {
        return _hash(_nonce, _sender, _interval);
    }

    function amount(bytes32 nonceHash) public pure returns (uint256) {
        return _amount(nonceHash);
    }

    function zeros(bytes32 nonceHash) public pure returns (uint8) {
        return _zeros(nonceHash);
    }
}
