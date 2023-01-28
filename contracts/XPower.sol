// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

import "./base/Migratable.sol";
import "./base/FeeTracker.sol";

import "./libs/Constants.sol";
import "./libs/Polynomials.sol";
import "./libs/Interpolators.sol";

/**
 * Abstract base class for the XPower THOR, LOKI and ODIN proof-of-work tokens.
 * It verifies, that the nonce & the block-hash do result in a positive amount,
 * (as specified by the sub-classes). After the verification, the corresponding
 * amount of tokens are minted for the beneficiary (plus the treasury).
 */
abstract contract XPower is ERC20, ERC20Burnable, MoeMigratable, FeeTracker, XPowerSupervised, Ownable {
    using Integrator for Integrator.Item[];
    using Polynomials for Polynomial;
    /** set of nonce-hashes already minted for */
    mapping(bytes32 => bool) private _hashes;
    /** map from block-hashes to timestamps */
    mapping(bytes32 => uint256) internal _timestamps;
    /** map from intervals to block-hashes */
    mapping(uint256 => bytes32) internal _blockHashes;

    /** @param symbol short token symbol */
    /** @param moeBase addresses of old contracts */
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
    {}

    /** emitted on caching most recent block-hash */
    event Init(bytes32 blockHash, uint256 timestamp);

    /** cache most recent block-hash */
    function init() public {
        uint256 interval = currentInterval();
        assert(interval > 0);
        if (uint256(_blockHashes[interval]) == 0) {
            bytes32 blockHash = blockhash(block.number - 1);
            assert(blockHash > 0);
            uint256 timestamp = block.timestamp;
            assert(timestamp > 0);
            _timestamps[blockHash] = timestamp;
            _blockHashes[interval] = blockHash;
            emit Init(blockHash, timestamp);
        } else {
            bytes32 blockHash = _blockHashes[interval];
            uint256 timestamp = _timestamps[blockHash];
            emit Init(blockHash, timestamp);
        }
    }

    /** mint tokens for to-beneficiary, block-hash & nonce */
    function mint(address to, bytes32 blockHash, uint256 nonce) public tracked {
        // check block-hash to be in current interval
        require(_current(blockHash), "expired block-hash");
        // calculate nonce-hash for to, block-hash & nonce
        bytes32 nonceHash = _hashOf(to, blockHash, nonce);
        require(!_hashes[nonceHash], "duplicate nonce-hash");
        // calculate number of zeros of nonce-hash
        uint256 zeros = _zerosOf(nonceHash);
        require(zeros > 0, "empty nonce-hash");
        // calculate amount of tokens of zeros
        uint256 amount = amountOf(zeros);
        // ensure unique nonce-hash
        _hashes[nonceHash] = true;
        // mint for project treasury
        _mint(owner(), shareOf(amount));
        // mint for beneficiary
        _mint(to, amount);
    }

    /** @return block-hash (for given interval) */
    function blockHashOf(uint256 interval) public view returns (bytes32) {
        return _blockHashes[interval];
    }

    /** @return current interval's timestamp */
    function currentInterval() public view returns (uint256) {
        return block.timestamp - (block.timestamp % (1 hours));
    }

    /** check whether block-hash has recently been cached */
    function _current(bytes32 blockHash) internal view returns (bool) {
        return _timestamps[blockHash] > currentInterval();
    }

    /** @return hash of contract, to-beneficiary, block-hash & nonce */
    function _hashOf(address to, bytes32 blockHash, uint256 nonce) internal view virtual returns (bytes32) {
        return keccak256(abi.encode(address(this), to, blockHash, nonce));
    }

    /** @return leading-zeros (for given nonce-hash) */
    function _zerosOf(bytes32 nonceHash) internal pure returns (uint8) {
        if (nonceHash > 0) {
            return uint8(63 - (Math.log2(uint256(nonceHash)) >> 2));
        }
        return 64;
    }

    /** @return amount (for given level) */
    function _amountOf(uint256 level) internal view virtual returns (uint256);

    /** interpolation anchor of treasury-share: amount => value */
    mapping(uint256 => uint256) private _shareSourceValue;
    /** interpolation anchor of treasury-share: amount => timestamp */
    mapping(uint256 => uint256) private _shareSourceStamp;
    /** parametrization of treasury-share */
    uint256[] private _share = [0, 0, 2, 1, 0, 0];

    /** @return interpolated share w/1-year lag (for amount) */
    function shareOf(uint256 amount) public view returns (uint256) {
        if (_shareSourceStamp[amount] == 0) {
            return shareTargetOf(amount);
        }
        uint256 nowStamp = block.timestamp;
        uint256 srcStamp = _shareSourceStamp[amount];
        uint256 tgtStamp = srcStamp + Constants.YEAR;
        uint256 srcValue = _shareSourceValue[amount];
        uint256 tgtValue = shareTargetOf(amount);
        return Interpolators.linear(srcStamp, srcValue, tgtStamp, tgtValue, nowStamp);
    }

    /** @return treasury-share (for given amount) */
    function shareTargetOf(uint256 amount) public view returns (uint256) {
        return shareTargetOf(amount, _share);
    }

    /** @return treasury-share (for given amount & parametrization) */
    function shareTargetOf(uint256 amount, uint256[] memory array) private pure returns (uint256) {
        return Polynomial(array).evalClamped(amount);
    }

    /** @return treasury-share parameters */
    function getTreasuryShare() public view returns (uint256[] memory) {
        return _share;
    }

    /** set treasury-share parameters */
    function setTreasuryShare(uint256[] memory array) public onlyRole(TREASURY_SHARE_ROLE) {
        require(array.length == 6, "invalid array.length");
        // eliminate possibility of division-by-zero
        require(array[2] > 0, "invalid array[2] == 0");
        // eliminate possibility of all-zero values
        require(array[3] > 0, "invalid array[3] == 0");
        for (uint256 zeros = 0; zeros <= 64; zeros++) {
            uint256 amount = _amountOf(zeros);
            // check share reparametrization of value
            uint256 lastValue = shareTargetOf(amount);
            uint256 nextValue = shareTargetOf(amount, array);
            _checkShareValue(nextValue, lastValue);
            _shareSourceValue[amount] = shareOf(amount);
            // check share reparametrization of stamp
            uint256 lastStamp = _shareSourceStamp[amount];
            uint256 nextStamp = block.timestamp;
            _checkShareStamp(nextStamp, lastStamp);
            _shareSourceStamp[amount] = nextStamp;
        }
        _share = array;
    }

    /** validate treasury-share change: 0.5 <= next / last <= 2.0 or next <= amountOf(1) */
    function _checkShareValue(uint256 nextValue, uint256 lastValue) private view {
        if (nextValue < lastValue) {
            require(lastValue <= 2 * nextValue, "invalid change: too small");
        }
        if (nextValue > lastValue && lastValue > 0) {
            require(nextValue <= 2 * lastValue, "invalid change: too large");
        }
        if (nextValue > lastValue && lastValue == 0) {
            require(nextValue <= _amountOf(1), "invalid change: too large");
        }
    }

    /** validate treasury-share change: invocation frequency at most at once per month */
    function _checkShareStamp(uint256 nextStamp, uint256 lastStamp) private pure {
        if (lastStamp > 0) {
            require(nextStamp - lastStamp > Constants.MONTH, "invalid change: too frequent");
        }
    }

    /** @return true if this contract implements the interface defined by interfaceId */
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
 * amount equals to *only* |leading-zeros(nonce-hash)|.
 */
contract XPowerThor is XPower {
    /** @param moeBase addresses of old contracts */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address[] memory moeBase, uint256 deadlineIn) XPower("THOR", moeBase, deadlineIn) {}

    /** @return amount (for given level) */
    function _amountOf(uint256 level) internal view override returns (uint256) {
        return level * 10 ** decimals();
    }

    /** @return prefix of token */
    function prefix() public pure override returns (uint256) {
        return 1;
    }
}

/**
 * Allow mining & minting for LOKI proof-of-work tokens, where the rewarded
 * amount equals to 2 ^ |leading-zeros(nonce-hash)| - 1.
 */
contract XPowerLoki is XPower {
    /** @param moeBase addresses of old contracts */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address[] memory moeBase, uint256 deadlineIn) XPower("LOKI", moeBase, deadlineIn) {}

    /** @return amount (for given level) */
    function _amountOf(uint256 level) internal view override returns (uint256) {
        return (2 ** level - 1) * 10 ** decimals();
    }

    /** @return prefix of token */
    function prefix() public pure override returns (uint256) {
        return 2;
    }
}

/**
 * Allow mining & minting for ODIN proof-of-work tokens, where the rewarded
 * amount equals to 16 ^ |leading-zeros(nonce-hash)| - 1.
 */
contract XPowerOdin is XPower {
    /** @param moeBase addresses of old contracts */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address[] memory moeBase, uint256 deadlineIn) XPower("ODIN", moeBase, deadlineIn) {}

    /** @return amount (for given level) */
    function _amountOf(uint256 level) internal view override returns (uint256) {
        return (16 ** level - 1) * 10 ** decimals();
    }

    /** @return prefix of token */
    function prefix() public pure override returns (uint256) {
        return 3;
    }
}
