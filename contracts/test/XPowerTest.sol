// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
pragma solidity ^0.8.0;
import "../XPower.sol";

/** Test class for XPowerThor */
contract XPowerThorTest is XPowerThor {
    constructor(address[] memory _base, uint256 _deadlineIn) XPowerThor(_base, _deadlineIn) {}

    function amountOf(bytes32 _nonceHash) public view returns (uint256) {
        return _amountOf(_nonceHash);
    }

    function cache(bytes32 _blockHash) public {
        _timestamps[_blockHash] = block.timestamp;
    }

    function hashOf(address _to, bytes32 _blockHash, uint256 _nonce) public view returns (bytes32) {
        return _hashOf(_to, _blockHash, _nonce);
    }

    function zerosOf(bytes32 _nonceHash) public pure returns (uint8) {
        return _zerosOf(_nonceHash);
    }
}

contract XPowerThorOldTest is XPowerThorTest {
    constructor(address[] memory _base, uint256 _deadlineIn) XPowerThorTest(_base, _deadlineIn) {}

    function decimals() public pure override returns (uint8) {
        return 0;
    }
}

/** Test class for XPowerLoki */
contract XPowerLokiTest is XPowerLoki {
    constructor(address[] memory _base, uint256 _deadlineIn) XPowerLoki(_base, _deadlineIn) {}

    function amountOf(bytes32 _nonceHash) public view returns (uint256) {
        return _amountOf(_nonceHash);
    }

    function cache(bytes32 _blockHash) public {
        _timestamps[_blockHash] = block.timestamp;
    }

    function hashOf(address _to, bytes32 _blockHash, uint256 _nonce) public view returns (bytes32) {
        return _hashOf(_to, _blockHash, _nonce);
    }

    function zerosOf(bytes32 _nonceHash) public pure returns (uint8) {
        return _zerosOf(_nonceHash);
    }
}

contract XPowerLokiOldTest is XPowerLokiTest {
    constructor(address[] memory _base, uint256 _deadlineIn) XPowerLokiTest(_base, _deadlineIn) {}

    function decimals() public pure override returns (uint8) {
        return 0;
    }
}

/** Test class for XPowerOdin */
contract XPowerOdinTest is XPowerOdin {
    constructor(address[] memory _base, uint256 _deadlineIn) XPowerOdin(_base, _deadlineIn) {}

    function amountOf(bytes32 _nonceHash) public view returns (uint256) {
        return _amountOf(_nonceHash);
    }

    function cache(bytes32 _blockHash) public {
        _timestamps[_blockHash] = block.timestamp;
    }

    function hashOf(address _to, bytes32 _blockHash, uint256 _nonce) public view returns (bytes32) {
        return _hashOf(_to, _blockHash, _nonce);
    }

    function zerosOf(bytes32 _nonceHash) public pure returns (uint8) {
        return _zerosOf(_nonceHash);
    }
}

contract XPowerOdinOldTest is XPowerOdinTest {
    constructor(address[] memory _base, uint256 _deadlineIn) XPowerOdinTest(_base, _deadlineIn) {}

    function decimals() public pure override returns (uint8) {
        return 0;
    }
}
