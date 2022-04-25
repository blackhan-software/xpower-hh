// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

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
abstract contract XPower is ERC20, ERC20Burnable, Migratable {
    using EnumerableSet for EnumerableSet.UintSet;
    /** set of nonce-hashes already minted for */
    EnumerableSet.UintSet private _hashes;
    /** map from block-hashes to timestamps */
    mapping(bytes32 => uint256) internal _timestamps;
    /** anchor for difficulty calculation */
    uint256 private immutable _timestamp;
    /** parametrization of treasure-for */
    uint256[] private _thetas = [0, 2, 1, 0];
    /** parametrization of difficulty-for */
    uint256[] private _deltas = [0, 4, 1, 0];

    /** @param symbol short token symbol */
    /** @param base address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(
        string memory symbol,
        address base,
        uint256 deadlineIn
    )
        // ERC20 constructor: name, symbol
        ERC20("XPower", symbol)
        // Migratable: old contract, rel. deadline [seconds]
        Migratable(base, deadlineIn)
    {
        _timestamp = 0x6215621e; // 2022-02-22T22:22:22Z
    }

    /** @return number of decimal places of the token */
    function decimals() public pure override returns (uint8) {
        return 0;
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
        if (amount > _thetas[3]) {
            return ((amount - _thetas[3]) * _thetas[2]) / _thetas[1] + _thetas[0];
        }
        return _thetas[0];
    }

    /** @return treasure parameters */
    function getTheta() public view returns (uint256[] memory) {
        return _thetas;
    }

    /** set treasure parameters */
    function setTheta(uint256[] memory array) public onlyOwner {
        require(array.length == 4, "invalid array.length");
        _thetas = array;
    }

    /** @return difficulty for given timestamp */
    function difficultyFor(uint256 timestamp) public view returns (uint256) {
        uint256 dt = timestamp - _timestamp;
        if (dt > _deltas[3]) {
            return (100 * (dt - _deltas[3]) * _deltas[2]) / (_deltas[1] * 365_25 days) + _deltas[0];
        }
        return _deltas[0];
    }

    /** @return difficulty parameters */
    function getDelta() public view returns (uint256[] memory) {
        return _deltas;
    }

    /** set difficulty parameters */
    function setDelta(uint256[] memory array) public onlyOwner {
        require(array.length == 4, "invalid array.length");
        _deltas = array;
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
    /** @param base address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address base, uint256 deadlineIn) XPower("THOR", base, deadlineIn) {}

    /** @return amount for provided nonce-hash */
    function _amountOf(bytes32 nonceHash) internal view override returns (uint256) {
        uint256 difficulty = difficultyFor(block.timestamp);
        uint256 zeros = _zerosOf(nonceHash);
        if (zeros > difficulty) {
            return zeros - difficulty;
        }
        return 0;
    }
}

/**
 * Allow mining & minting for LOKI proof-of-work tokens, where the rewarded
 * amount equals to 2 ^ |leading-zeros(nonce-hash) - difficulty| - 1.
 */
contract XPowerLoki is XPower {
    /** @param base address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address base, uint256 deadlineIn) XPower("LOKI", base, deadlineIn) {}

    /** @return amount for provided nonce-hash */
    function _amountOf(bytes32 nonceHash) internal view override returns (uint256) {
        uint256 difficulty = difficultyFor(block.timestamp);
        uint256 zeros = _zerosOf(nonceHash);
        if (zeros > difficulty) {
            return 2**(zeros - difficulty) - 1;
        }
        return 0;
    }
}

/**
 * Allow mining & minting for ODIN proof-of-work tokens, where the rewarded
 * amount equals to 16 ^ |leading-zeros(nonce-hash) - difficulty| - 1.
 */
contract XPowerOdin is XPower {
    /** @param base address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address base, uint256 deadlineIn) XPower("ODIN", base, deadlineIn) {}

    /** @return amount for provided nonce-hash */
    function _amountOf(bytes32 nonceHash) internal view override returns (uint256) {
        uint256 difficulty = difficultyFor(block.timestamp);
        uint256 zeros = _zerosOf(nonceHash);
        if (zeros > difficulty) {
            return 16**(zeros - difficulty) - 1;
        }
        return 0;
    }
}
