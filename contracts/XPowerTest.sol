// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;
import "./XPower.sol";

/** Test class for XPowerCpu */
contract XPowerCpuTest is XPowerCpu {
    constructor(address _base, uint256 _deadlineIn) XPowerCpu(_base, _deadlineIn) {}

    function interval() public view returns (uint256) {
        return _interval();
    }

    function hash(
        uint256 _nonce,
        address _sender,
        uint256 _interval,
        bytes32 _blockHash
    ) public pure returns (bytes32) {
        return _hash(_nonce, _sender, _interval, _blockHash);
    }

    function amount(bytes32 _nonceHash) public pure returns (uint256) {
        return _amount(_nonceHash);
    }

    function zeros(bytes32 _nonceHash) public pure returns (uint8) {
        return _zeros(_nonceHash);
    }
}

/** Test class for XPowerGpu */
contract XPowerGpuTest is XPowerGpu {
    constructor(address _base, uint256 _deadlineIn) XPowerGpu(_base, _deadlineIn) {}

    function interval() public view returns (uint256) {
        return _interval();
    }

    function hash(
        uint256 _nonce,
        address _sender,
        uint256 _interval,
        bytes32 _blockHash
    ) public pure returns (bytes32) {
        return _hash(_nonce, _sender, _interval, _blockHash);
    }

    function amount(bytes32 _nonceHash) public pure returns (uint256) {
        return _amount(_nonceHash);
    }

    function zeros(bytes32 _nonceHash) public pure returns (uint8) {
        return _zeros(_nonceHash);
    }
}

/** Test class for XPowerAsic */
contract XPowerAsicTest is XPowerAsic {
    constructor(address _base, uint256 _deadlineIn) XPowerAsic(_base, _deadlineIn) {}

    function interval() public view returns (uint256) {
        return _interval();
    }

    function hash(
        uint256 _nonce,
        address _sender,
        uint256 _interval,
        bytes32 _blockHash
    ) public pure returns (bytes32) {
        return _hash(_nonce, _sender, _interval, _blockHash);
    }

    function amount(bytes32 _nonceHash) public pure returns (uint256) {
        return _amount(_nonceHash);
    }

    function zeros(bytes32 _nonceHash) public pure returns (uint8) {
        return _zeros(_nonceHash);
    }
}
