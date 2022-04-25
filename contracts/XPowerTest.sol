// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;
import "./XPower.sol";

/** Test class for XPowerThor */
contract XPowerThorTest is XPowerThor {
    constructor(address _base, uint256 _deadlineIn) XPowerThor(_base, _deadlineIn) {}

    function amountOf(bytes32 _nonceHash) public view returns (uint256) {
        return _amountOf(_nonceHash);
    }

    function cache(bytes32 _blockHash) public {
        _timestamps[_blockHash] = block.timestamp;
    }

    function hashOf(
        address _to,
        uint256 _interval,
        bytes32 _blockHash,
        uint256 _nonce
    ) public view returns (bytes32) {
        return _hashOf(_to, _interval, _blockHash, _nonce);
    }

    function intervalOf() public view returns (uint256) {
        return _interval();
    }

    function zerosOf(bytes32 _nonceHash) public pure returns (uint8) {
        return _zerosOf(_nonceHash);
    }
}

/** Test class for XPowerLoki */
contract XPowerLokiTest is XPowerLoki {
    constructor(address _base, uint256 _deadlineIn) XPowerLoki(_base, _deadlineIn) {}

    function amountOf(bytes32 _nonceHash) public view returns (uint256) {
        return _amountOf(_nonceHash);
    }

    function cache(bytes32 _blockHash) public {
        _timestamps[_blockHash] = block.timestamp;
    }

    function hashOf(
        address _to,
        uint256 _interval,
        bytes32 _blockHash,
        uint256 _nonce
    ) public view returns (bytes32) {
        return _hashOf(_to, _interval, _blockHash, _nonce);
    }

    function interval() public view returns (uint256) {
        return _interval();
    }

    function zerosOf(bytes32 _nonceHash) public pure returns (uint8) {
        return _zerosOf(_nonceHash);
    }
}

/** Test class for XPowerOdin */
contract XPowerOdinTest is XPowerOdin {
    constructor(address _base, uint256 _deadlineIn) XPowerOdin(_base, _deadlineIn) {}

    function amountOf(bytes32 _nonceHash) public view returns (uint256) {
        return _amountOf(_nonceHash);
    }

    function cache(bytes32 _blockHash) public {
        _timestamps[_blockHash] = block.timestamp;
    }

    function hashOf(
        address _to,
        uint256 _interval,
        bytes32 _blockHash,
        uint256 _nonce
    ) public view returns (bytes32) {
        return _hashOf(_to, _interval, _blockHash, _nonce);
    }

    function interval() public view returns (uint256) {
        return _interval();
    }

    function zerosOf(bytes32 _nonceHash) public pure returns (uint8) {
        return _zerosOf(_nonceHash);
    }
}
