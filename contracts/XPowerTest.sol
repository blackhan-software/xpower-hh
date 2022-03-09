// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;
import "./XPower.sol";

/** Test class for XPowerPara */
contract XPowerParaTest is XPowerPara {
    constructor(address _base, uint256 _deadlineIn) XPowerPara(_base, _deadlineIn) {}

    function interval() public view returns (uint256) {
        return _interval();
    }

    function hash(
        address _to,
        uint256 _interval,
        bytes32 _blockHash,
        uint256 _nonce
    ) public view returns (bytes32) {
        return _hash(_to, _interval, _blockHash, _nonce);
    }

    function amount(bytes32 _nonceHash) public view returns (uint256) {
        return _amount(_nonceHash);
    }

    function zeros(bytes32 _nonceHash) public pure returns (uint8) {
        return _zeros(_nonceHash);
    }
}

/** Test class for XPowerAqch */
contract XPowerAqchTest is XPowerAqch {
    constructor(address _base, uint256 _deadlineIn) XPowerAqch(_base, _deadlineIn) {}

    function interval() public view returns (uint256) {
        return _interval();
    }

    function hash(
        address _to,
        uint256 _interval,
        bytes32 _blockHash,
        uint256 _nonce
    ) public view returns (bytes32) {
        return _hash(_to, _interval, _blockHash, _nonce);
    }

    function amount(bytes32 _nonceHash) public view returns (uint256) {
        return _amount(_nonceHash);
    }

    function zeros(bytes32 _nonceHash) public pure returns (uint8) {
        return _zeros(_nonceHash);
    }
}

/** Test class for XPowerQrsh */
contract XPowerQrshTest is XPowerQrsh {
    constructor(address _base, uint256 _deadlineIn) XPowerQrsh(_base, _deadlineIn) {}

    function interval() public view returns (uint256) {
        return _interval();
    }

    function hash(
        address _to,
        uint256 _interval,
        bytes32 _blockHash,
        uint256 _nonce
    ) public view returns (bytes32) {
        return _hash(_to, _interval, _blockHash, _nonce);
    }

    function amount(bytes32 _nonceHash) public view returns (uint256) {
        return _amount(_nonceHash);
    }

    function zeros(bytes32 _nonceHash) public pure returns (uint8) {
        return _zeros(_nonceHash);
    }
}
