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
abstract contract XPower is ERC20, ERC20Burnable, MoeMigratable, XPowerSupervised, Ownable {
    using EnumerableSet for EnumerableSet.UintSet;
    /** set of nonce-hashes already minted for */
    EnumerableSet.UintSet private _hashes;
    /** map from block-hashes to timestamps */
    mapping(bytes32 => uint256) internal _timestamps;
    /** map from intervals to block-hashes */
    mapping(uint256 => bytes32) internal _blockHashes;
    /** anchor for difficulty calculation */
    uint256 private immutable _timestamp;
    /** parametrization of treasury-share */
    uint256[] private _share = [0, 0, 2, 1, 0, 0];
    /** parametrization of mining-difficulty */
    uint256[] private _rigor = [0, 0, 4, 1, 0, 0];

    /** total mints */
    uint256 private _totalMints = 0;
    /** total minted amounts */
    uint256 private _totalMinted = 0;
    /** total minting fees */
    uint256 private _totalMintingFees = 0;

    /** @return total mints */
    function totalMints() public view returns (uint256) {
        return _totalMints;
    }

    /** @return total minted amounts */
    function totalMinted() public view returns (uint256) {
        return _totalMinted;
    }

    /** @return total minting fees */
    function totalMintingFees() public view returns (uint256) {
        return _totalMintingFees;
    }

    /** @param symbol short token symbol */
    /** @param moeBase address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(
        string memory symbol,
        address[] memory moeBase,
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
        uint256 interval = currentInterval();
        if (uint256(_blockHashes[interval]) == 0) {
            bytes32 blockHash = blockhash(block.number - 1);
            require(blockHash > 0, "invalid block-hash");
            uint256 timestamp = block.timestamp;
            require(timestamp > 0, "invalid timestamp");
            _timestamps[blockHash] = timestamp;
            _blockHashes[interval] = blockHash;
            emit Init(blockHash, timestamp);
        } else {
            bytes32 blockHash = _blockHashes[interval];
            uint256 timestamp = _timestamps[blockHash];
            emit Init(blockHash, timestamp);
        }
    }

    /** mint tokens for beneficiary, interval, block-hash and nonce */
    function mint(address to, bytes32 blockHash, uint256 nonce) public {
        uint256 gas = gasleft();
        // check block-hash to be in current interval
        _requireCurrent(blockHash, currentInterval());
        // calculate nonce-hash for to, block-hash & nonce
        bytes32 nonceHash = _hashOf(to, blockHash, nonce);
        require(!_hashes.contains(uint256(nonceHash)), "duplicate nonce-hash");
        // calculate amount of tokens for nonce-hash
        uint256 amount = _amountOf(nonceHash);
        require(amount > 0, "empty nonce-hash");
        // ensure unique nonce-hash (to be used once)
        _hashes.add(uint256(nonceHash));
        // mint tokens for owner (i.e. project treasury)
        uint256 treasure = treasuryShare(amount);
        if (treasure > 0) _mint(owner(), treasure);
        // mint tokens for beneficiary (e.g. nonce provider)
        _mint(to, amount);
        // increment total mints
        _totalMints += 1;
        // increment total amounts minted
        _totalMinted += amount;
        // increment total fees spent
        _totalMintingFees += (gas - gasleft()) * tx.gasprice;
    }

    /** @return current interval (in hours) */
    function currentInterval() public view returns (uint256) {
        uint256 interval = block.timestamp / (1 hours);
        require(interval > 0, "invalid interval");
        return interval;
    }

    /** @return block-hash of given interval */
    function blockHashOf(uint256 interval) public view returns (bytes32) {
        return _blockHashes[interval];
    }

    /** @return treasury-share for given amount */
    function treasuryShare(uint256 amount) public view returns (uint256) {
        return ((amount + _share[5] - _share[4]) * _share[3]) / _share[2] + _share[1] - _share[0];
    }

    /** @return treasury-share parameters */
    function getTreasuryShare() public view returns (uint256[] memory) {
        return _share;
    }

    /** set treasury-share parameters */
    function setTreasuryShare(uint256[] memory array) public onlyRole(TREASURY_SHARE_ROLE) {
        require(array.length == 6, "invalid array.length");
        _share = array;
    }

    /** @return mining-difficulty for given timestamp */
    function miningDifficulty(uint256 timestamp) public view returns (uint256) {
        uint256 dt = timestamp - _timestamp;
        return (100 * (dt + _rigor[5] - _rigor[4]) * _rigor[3]) / (_rigor[2] * 365_25 days) + _rigor[1] - _rigor[0];
    }

    /** @return mining-difficulty parameters */
    function getMiningDifficulty() public view returns (uint256[] memory) {
        return _rigor;
    }

    /** set mining-difficulty parameters */
    function setMiningDifficulty(uint256[] memory array) public onlyRole(MINING_DIFFICULTY_ROLE) {
        require(array.length == 6, "invalid array.length");
        _rigor = array;
    }

    /** check whether block-hash has been cached for given interval */
    function _requireCurrent(bytes32 blockHash, uint256 interval) internal view {
        require(blockHash > 0, "invalid block-hash");
        uint256 timestamp = _timestamps[blockHash];
        if (timestamp / (1 hours) != interval) {
            revert("expired block-hash");
        }
    }

    /** @return hash of contract, beneficiary, block-hash & nonce */
    function _hashOf(address to, bytes32 blockHash, uint256 nonce) internal view virtual returns (bytes32) {
        return keccak256(abi.encode(address(this), to, blockHash, nonce));
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

    /** returns true if this contract implements the interface defined by interfaceId */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(MoeMigratable, Supervised) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /** @return prefix of token */
    function prefix() public pure virtual returns (uint256);
}

/**
 * Allow mining & minting for THOR proof-of-work tokens, where the rewarded
 * amount equals to *only* |leading-zeros(nonce-hash) - difficulty|.
 */
contract XPowerThor is XPower {
    /** @param moeBase address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address[] memory moeBase, uint256 deadlineIn) XPower("THOR", moeBase, deadlineIn) {}

    /** @return amount for provided nonce-hash */
    function _amountOf(bytes32 nonceHash) internal view override returns (uint256) {
        uint256 difficulty = miningDifficulty(block.timestamp);
        uint256 zeros = _zerosOf(nonceHash);
        if (zeros > difficulty) {
            return (zeros - difficulty) * 10 ** decimals();
        }
        return 0;
    }

    /** @return prefix of token */
    function prefix() public pure override returns (uint256) {
        return 1;
    }
}

/**
 * Allow mining & minting for LOKI proof-of-work tokens, where the rewarded
 * amount equals to 2 ^ |leading-zeros(nonce-hash) - difficulty| - 1.
 */
contract XPowerLoki is XPower {
    /** @param moeBase address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address[] memory moeBase, uint256 deadlineIn) XPower("LOKI", moeBase, deadlineIn) {}

    /** @return amount for provided nonce-hash */
    function _amountOf(bytes32 nonceHash) internal view override returns (uint256) {
        uint256 difficulty = miningDifficulty(block.timestamp);
        uint256 zeros = _zerosOf(nonceHash);
        if (zeros > difficulty) {
            return (2 ** (zeros - difficulty) - 1) * 10 ** decimals();
        }
        return 0;
    }

    /** @return prefix of token */
    function prefix() public pure override returns (uint256) {
        return 2;
    }
}

/**
 * Allow mining & minting for ODIN proof-of-work tokens, where the rewarded
 * amount equals to 16 ^ |leading-zeros(nonce-hash) - difficulty| - 1.
 */
contract XPowerOdin is XPower {
    /** @param moeBase address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address[] memory moeBase, uint256 deadlineIn) XPower("ODIN", moeBase, deadlineIn) {}

    /** @return amount for provided nonce-hash */
    function _amountOf(bytes32 nonceHash) internal view override returns (uint256) {
        uint256 difficulty = miningDifficulty(block.timestamp);
        uint256 zeros = _zerosOf(nonceHash);
        if (zeros > difficulty) {
            return (16 ** (zeros - difficulty) - 1) * 10 ** decimals();
        }
        return 0;
    }

    /** @return prefix of token */
    function prefix() public pure override returns (uint256) {
        return 3;
    }
}
