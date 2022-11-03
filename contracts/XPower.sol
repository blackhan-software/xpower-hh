// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "./Migratable.sol";

/**
 * Abstract base class for the XPower THOR, LOKI and ODIN proof-of-work tokens.
 * It verifies, that the nonce & the block-hash do result in a positive amount,
 * (as specified by the sub-classes). After the verification, the corresponding
 * amount of tokens are minted for the beneficiary (plus the treasury).
 */
abstract contract XPower is ERC20, ERC20Burnable, MoeMigratable, Ownable {
    using EnumerableSet for EnumerableSet.UintSet;
    /** set of nonce-hashes already minted for */
    EnumerableSet.UintSet private _hashes;
    /** map from block-hashes to timestamps */
    mapping(bytes32 => uint256) internal _timestamps;
    /** anchor for difficulty calculation */
    uint256 private immutable _timestamp;
    /** parametrization of treasure-for */
    uint256[] private _theta = [0, 0, 2, 1, 0, 0];
    /** parametrization of difficulty-for */
    uint256[] private _delta = [0, 0, 4, 1, 0, 0];

    /** @param symbol short token symbol */
    /** @param moeBase address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(
        string memory symbol,
        address moeBase,
        uint256 deadlineIn
    )
        // ERC20 constructor: name, symbol
        ERC20("XPower", symbol)
        // Migratable: old contract, rel. deadline [seconds]
        Migratable(moeBase, deadlineIn)
    {
        _timestamp = 0x6215621e; // 2022-02-22T22:22:22Z
    }

    /** emitted on caching most recent block-hash */
    event Init(bytes32 blockHash, uint256 timestamp);

    /** cache most recent block-hash */
    function init() public {
        bytes32 blockHash = blockhash(block.number - 1);
        require(blockHash > 0, "invalid block-hash");
        uint256 timestamp = block.timestamp;
        require(timestamp > 0, "invalid timestamp");
        _timestamps[blockHash] = timestamp;
        emit Init(blockHash, timestamp);
    }

    /** mint tokens for beneficiary, interval, block-hash and nonce */
    function mint(
        address to,
        bytes32 blockHash,
        uint256 nonce
    ) public {
        // get current interval (in hours)
        uint256 interval = _interval();
        // check block-hash to be recent
        _requireRecent(blockHash, interval);
        // calculate nonce-hash for to, interval, block-hash & nonce
        bytes32 nonceHash = _hashOf(to, interval, blockHash, nonce);
        require(!_hashes.contains(uint256(nonceHash)), "duplicate nonce-hash");
        // calculate amount of tokens for nonce-hash
        uint256 amount = _amountOf(nonceHash);
        require(amount > 0, "empty nonce-hash");
        // ensure unique nonce-hash (to be used once)
        _hashes.add(uint256(nonceHash));
        // mint tokens for beneficiary (e.g. nonce provider)
        _mint(to, amount);
        // mint tokens for owner (i.e. project treasury)
        uint256 treasure = treasureFor(amount);
        if (treasure > 0) _mint(owner(), treasure);
    }

    /** @return treasure for given amount */
    function treasureFor(uint256 amount) public view returns (uint256) {
        return ((amount + _theta[5] - _theta[4]) * _theta[3]) / _theta[2] + _theta[1] - _theta[0];
    }

    /** @return treasure parameters */
    function getTheta() public view returns (uint256[] memory) {
        return _theta;
    }

    /** set treasure parameters */
    function setTheta(uint256[] memory array) public onlyRole(THETA_ROLE) {
        require(array.length == 6, "invalid array.length");
        _theta = array;
    }

    /** @return difficulty for given timestamp */
    function difficultyFor(uint256 timestamp) public view returns (uint256) {
        uint256 dt = timestamp - _timestamp;
        return (100 * (dt + _delta[5] - _delta[4]) * _delta[3]) / (_delta[2] * 365_25 days) + _delta[1] - _delta[0];
    }

    /** @return difficulty parameters */
    function getDelta() public view returns (uint256[] memory) {
        return _delta;
    }

    /** set difficulty parameters */
    function setDelta(uint256[] memory array) public onlyRole(DELTA_ROLE) {
        require(array.length == 6, "invalid array.length");
        _delta = array;
    }

    /** check whether block-hash has recently been cached or is recent */
    function _requireRecent(bytes32 blockHash, uint256 interval) internal view {
        require(blockHash > 0, "invalid block-hash");
        uint256 timestamp = _timestamps[blockHash];
        if (timestamp / (1 hours) != interval) {
            for (uint256 i = 1; i <= 256; i++) {
                if (block.number >= i && blockhash(block.number - i) == blockHash) {
                    return; // block-hash is within the last 256 blocks
                }
            }
            revert("expired block-hash");
        }
    }

    /** @return current interval (in hours) */
    function _interval() internal view returns (uint256) {
        uint256 interval = block.timestamp / (1 hours);
        require(interval > 0, "invalid interval");
        return interval;
    }

    /** @return hash of beneficiary, interval, block-hash & nonce */
    function _hashOf(
        address to,
        uint256 interval,
        bytes32 blockHash,
        uint256 nonce
    ) internal view virtual returns (bytes32) {
        return keccak256(abi.encode(symbol(), to, interval, blockHash, nonce));
    }

    /** @return amount for provided nonce-hash */
    function _amountOf(bytes32 nonceHash) internal view virtual returns (uint256);

    /** @return leading zeros of provided nonce-hash */
    function _zerosOf(bytes32 nonceHash) internal pure returns (uint8) {
        uint8 counter = 0;
        for (uint8 i = 0; i < 32; i++) {
            bytes1 b = nonceHash[i];
            if (b == 0x00) {
                counter += 2;
                continue;
            }
            if (
                b == 0x01 ||
                b == 0x02 ||
                b == 0x03 ||
                b == 0x04 ||
                b == 0x05 ||
                b == 0x06 ||
                b == 0x07 ||
                b == 0x08 ||
                b == 0x09 ||
                b == 0x0a ||
                b == 0x0b ||
                b == 0x0c ||
                b == 0x0d ||
                b == 0x0e ||
                b == 0x0f
            ) {
                counter += 1;
                break;
            }
            break;
        }
        return counter;
    }
}

/**
 * Allow mining & minting for THOR proof-of-work tokens, where the rewarded
 * amount equals to *only* |leading-zeros(nonce-hash) - difficulty|.
 */
contract XPowerThor is XPower {
    /** @param moeBase address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address moeBase, uint256 deadlineIn) XPower("THOR", moeBase, deadlineIn) {}

    /** @return amount for provided nonce-hash */
    function _amountOf(bytes32 nonceHash) internal view override returns (uint256) {
        uint256 difficulty = difficultyFor(block.timestamp);
        uint256 zeros = _zerosOf(nonceHash);
        if (zeros > difficulty) {
            return (zeros - difficulty) * 10**decimals();
        }
        return 0;
    }
}

/**
 * Allow mining & minting for LOKI proof-of-work tokens, where the rewarded
 * amount equals to 2 ^ |leading-zeros(nonce-hash) - difficulty| - 1.
 */
contract XPowerLoki is XPower {
    /** @param moeBase address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address moeBase, uint256 deadlineIn) XPower("LOKI", moeBase, deadlineIn) {}

    /** @return amount for provided nonce-hash */
    function _amountOf(bytes32 nonceHash) internal view override returns (uint256) {
        uint256 difficulty = difficultyFor(block.timestamp);
        uint256 zeros = _zerosOf(nonceHash);
        if (zeros > difficulty) {
            return (2**(zeros - difficulty) - 1) * 10**decimals();
        }
        return 0;
    }
}

/**
 * Allow mining & minting for ODIN proof-of-work tokens, where the rewarded
 * amount equals to 16 ^ |leading-zeros(nonce-hash) - difficulty| - 1.
 */
contract XPowerOdin is XPower {
    /** @param moeBase address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address moeBase, uint256 deadlineIn) XPower("ODIN", moeBase, deadlineIn) {}

    /** @return amount for provided nonce-hash */
    function _amountOf(bytes32 nonceHash) internal view override returns (uint256) {
        uint256 difficulty = difficultyFor(block.timestamp);
        uint256 zeros = _zerosOf(nonceHash);
        if (zeros > difficulty) {
            return (16**(zeros - difficulty) - 1) * 10**decimals();
        }
        return 0;
    }
}
