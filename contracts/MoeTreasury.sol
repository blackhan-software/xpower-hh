// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
// solhint-disable reason-string
pragma solidity ^0.8.0;

import {APower} from "./APower.sol";
import {XPower} from "./XPower.sol";
import {XPowerPpt} from "./XPowerPpt.sol";

import {Array} from "./libs/Array.sol";
import {Constants} from "./libs/Constants.sol";
import {Integrator} from "./libs/Integrator.sol";
import {Polynomial, Polynomials} from "./libs/Polynomials.sol";
import {Rpp} from "./libs/Rpp.sol";
import {MoeTreasurySupervised} from "./base/Supervised.sol";

/**
 * Treasury to claim (MoE) tokens for staked XPowerNft(s).
 */
contract MoeTreasury is MoeTreasurySupervised {
    using Integrator for Integrator.Item[];
    using Polynomials for Polynomial;

    /** (burnable) proof-of-work tokens */
    XPower private _moe;
    /** (burnable) *aged* XPower tokens */
    APower private _sov;
    /** staked proof-of-work NFTs */
    XPowerPpt private _ppt;

    /** map of rewards claimed: account => nft-id => amount */
    mapping(address => mapping(uint256 => uint256)) private _claimed;

    /** @param moeLink address of contract for XPower tokens */
    /** @param sovLink address of contract for APower tokens */
    /** @param pptLink address of contract for staked NFTs */
    constructor(address moeLink, address sovLink, address pptLink) {
        _moe = XPower(moeLink);
        _sov = APower(sovLink);
        _ppt = XPowerPpt(pptLink);
    }

    /** emitted on claiming NFT reward */
    event Claim(address account, uint256 nftId, uint256 amount);

    /** claim APower tokens */
    function claimFor(address account, uint256 nftId) external {
        uint256 amount = claimableFor(account, nftId);
        require(amount > 0, "nothing claimable");
        _claimed[account][nftId] += amount;
        _moe.increaseAllowance(address(_sov), _sov.wrappable(amount));
        _sov.mint(account, amount);
        emit Claim(account, nftId, amount);
    }

    /** emitted on claiming NFT rewards */
    event ClaimBatch(address account, uint256[] nftIds, uint256[] amounts);

    /** claim APower tokens */
    function claimForBatch(address account, uint256[] memory nftIds) external {
        require(Array.unique(nftIds), "unsorted or duplicate ids");
        uint256[] memory amounts = claimableForBatch(account, nftIds);
        uint256 subsum;
        for (uint256 i = 0; i < nftIds.length; i++) {
            require(amounts[i] > 0, "nothing claimable");
            _claimed[account][nftIds[i]] += amounts[i];
            subsum += amounts[i];
        }
        _moe.increaseAllowance(address(_sov), _sov.wrappable(subsum));
        _sov.mint(account, subsum);
        emit ClaimBatch(account, nftIds, amounts);
    }

    /** @return claimed amount */
    function claimedFor(address account, uint256 nftId) public view returns (uint256) {
        return _claimed[account][nftId];
    }

    /** @return claimed amounts */
    function claimedForBatch(address account, uint256[] memory nftIds) public view returns (uint256[] memory) {
        uint256[] memory claimed = new uint256[](nftIds.length);
        for (uint256 i = 0; i < nftIds.length; i++) {
            claimed[i] = claimedFor(account, nftIds[i]);
        }
        return claimed;
    }

    /** @return claimable amount */
    function claimableFor(address account, uint256 nftId) public view returns (uint256) {
        uint256 claimed = claimedFor(account, nftId);
        uint256 reward = rewardOf(account, nftId);
        if (reward > claimed) {
            return reward - claimed;
        }
        return 0;
    }

    /** @return claimable amount */
    function claimableForBatch(address account, uint256[] memory nftIds) public view returns (uint256[] memory) {
        uint256[] memory claimed = claimedForBatch(account, nftIds);
        uint256[] memory rewards = rewardOfBatch(account, nftIds);
        uint256[] memory pending = new uint256[](nftIds.length);
        for (uint256 i = 0; i < nftIds.length; i++) {
            if (rewards[i] > claimed[i]) {
                pending[i] = rewards[i] - claimed[i];
            }
        }
        return pending;
    }

    /** @return reward amount */
    function rewardOf(address account, uint256 nftId) public view returns (uint256) {
        uint256 rate = rateOf(nftId);
        uint256 age = _ppt.ageOf(account, nftId);
        uint256 denomination = _ppt.denominationOf(_ppt.levelOf(nftId));
        uint256 reward = (rate * age * denomination) / (1_000_000 * Constants.CENTURY);
        return reward * 10 ** _moe.decimals();
    }

    /** @return reward amounts */
    function rewardOfBatch(address account, uint256[] memory nftIds) public view returns (uint256[] memory) {
        uint256[] memory rewards = new uint256[](nftIds.length);
        for (uint256 i = 0; i < nftIds.length; i++) {
            rewards[i] = rewardOf(account, nftIds[i]);
        }
        return rewards;
    }

    /** @return sum of APR and APR bonus */
    function rateOf(uint256 nftId) public view returns (uint256) {
        return aprOf(nftId) + aprBonusOf(nftId);
    }

    /** @return sum of APR and APR bonus targets */
    function rateTargetOf(uint256 nftId) external view returns (uint256) {
        return aprTargetOf(nftId) + aprBonusTargetOf(nftId);
    }

    /** integrator for APRs: nft-id => [(stamp, value)] */
    mapping(uint256 => Integrator.Item[]) public aprs;
    /** parametrization of APR: nft-id => coefficients */
    mapping(uint256 => uint256[]) private _apr;

    /** @return length of APRs */
    function aprsLength(uint256 nftId) external view returns (uint256) {
        uint256 id = _aprId(nftId);
        return aprs[id].length;
    }

    /** @return duration weighted mean of APRs */
    function aprOf(uint256 nftId) public view returns (uint256) {
        uint256 value = aprTargetOf(nftId);
        uint256 id = _aprId(nftId);
        if (aprs[id].length > 0) {
            return aprs[id].meanOf(block.timestamp, value);
        }
        return value;
    }

    /** @return target for annualized percentage rate */
    function aprTargetOf(uint256 nftId) public view returns (uint256) {
        return aprTargetOf(nftId, getAPR(nftId));
    }

    /** @return target for annualized percentage rate */
    function aprTargetOf(uint256 nftId, uint256[] memory array) private view returns (uint256) {
        return Polynomial(array).eval3(_ppt.levelOf(nftId));
    }

    /** annual percentage rate: 1.000000[%] (per nft.level) */
    uint256 private constant APR_MUL = 1_000_000;
    uint256 private constant APR_DIV = 3;

    /** @return APR parameters */
    function getAPR(uint256 nftId) public view returns (uint256[] memory) {
        uint256 id = _aprId(nftId);
        if (_apr[id].length > 0) {
            return _apr[id];
        }
        uint256[] memory array = new uint256[](3);
        array[1] = APR_DIV;
        array[2] = APR_MUL;
        return array;
    }

    /** set APR parameters */
    function setAPR(uint256 nftId, uint256[] memory array) public onlyRole(APR_ROLE) {
        Rpp.checkArray(array);
        // fixed nft-id as anchor
        uint256 id = _aprId(nftId);
        // check APR reparametrization of value
        uint256 nextValue = aprTargetOf(id, array);
        uint256 currValue = aprTargetOf(id);
        Rpp.checkValue(nextValue, currValue);
        // check APR reparametrization of stamp
        Rpp.checkStamp(block.timestamp, _lastStamp[id]);
        _lastStamp[id] = block.timestamp;
        // append (stamp, apr-of[nft-id]) to integrator
        aprs[id].append(block.timestamp, currValue);
        // all requirements satisfied: use array
        _apr[id] = array;
    }

    /** _lastStamp[id] != aprs[id].lastOf().stamp */
    mapping(uint256 => uint256) private _lastStamp;

    /** batch-set APR parameters */
    function setAPRBatch(uint256[] memory nftIds, uint256[] memory array) external onlyRole(APR_ROLE) {
        for (uint256 i = 0; i < nftIds.length; i++) {
            setAPR(nftIds[i], array);
        }
    }

    /** emitted on refreshing APR parameters */
    event RefreshRates(bool allLevels);

    /** refresh APR parameters */
    function refreshRates(bool allLevels) external {
        int256[34] memory shares = _ppt.shares();
        (uint256 bins, uint256 sum, uint256 max) = _moments(shares);
        uint256 maxLength = allLevels ? shares.length : max;
        for (uint256 i = 0; i < maxLength; i++) {
            uint256 id = _ppt.idBy(2021, 3 * i);
            Integrator.Item memory item = aprs[id].lastOf();
            uint256 target = aprTargetOf(id);
            if (item.stamp == 0) {
                aprs[id].append(block.timestamp - Constants.MONTH, target);
                aprs[id].append(block.timestamp, target); // laggy init
            } else if (item.value != target) {
                aprs[id].append(block.timestamp, target);
            }
            if (shares[i] > 0) {
                if (_apr[id].length == 0) {
                    _apr[id] = [_scalar(APR_MUL, sum, bins, shares[i]), type(uint256).max, APR_MUL];
                } else {
                    _apr[id][0] = _scalar(_apr[id][2], sum, bins, shares[i]);
                    _apr[id][1] = type(uint256).max; // div-by-infinity
                }
            } else if (_apr[id].length > 0) {
                _apr[id][0] = 0; // clear
                _apr[id][1] = APR_DIV;
            }
        }
        emit RefreshRates(allLevels);
    }

    /** @return refreshable flag */
    function refreshable() external view returns (bool) {
        int256[34] memory shares = _ppt.shares();
        (uint256 bins, uint256 sum, ) = _moments(shares);
        for (uint256 i = 0; i < shares.length; i++) {
            uint256 id = _ppt.idBy(2021, 3 * i);
            Integrator.Item memory item = aprs[id].lastOf();
            if (item.stamp == 0) {
                return true;
            }
            if (shares[i] > 0) {
                if (_apr[id].length == 0) {
                    return true;
                }
                if (_apr[id][0] != _scalar(_apr[id][2], sum, bins, shares[i])) {
                    return true;
                }
                if (_apr[id][1] != type(uint256).max) {
                    return true;
                }
            } else if (_apr[id].length > 0) {
                if (_apr[id][0] != 0) {
                    return true;
                }
                if (_apr[id][1] != APR_DIV) {
                    return true;
                }
            }
        }
        return false;
    }

    /** @return moments of (bins, sum, max) */
    function _moments(int256[34] memory shares) private pure returns (uint256, uint256, uint256) {
        (uint256 bins, uint256 sum, uint256 max) = (0, 0, 0);
        for (uint256 i = 0; i < shares.length; i++) {
            if (shares[i] > 0) {
                sum += uint256(shares[i]);
                max = i + 1;
                bins++;
            }
        }
        return (bins, sum, max);
    }

    /** @return additive scalar (for mul, sum, bins & share) */
    function _scalar(uint256 mul, uint256 sum, uint256 bins, int256 share) private pure returns (uint256) {
        assert(bins > 0 && share > 0); // no div-by-zero
        return (mul * sum) / (bins * uint256(share));
    }

    /** @return apr-id (for nft-level) */
    function _aprId(uint256 nftId) private view returns (uint256) {
        return _ppt.idBy(2021, _ppt.levelOf(nftId));
    }

    /** integrator for APR bonuses: nft-id => [(stamp, value)] */
    mapping(uint256 => Integrator.Item[]) public bonuses;
    /** parametrization of APR bonus: nft-id => coefficients */
    mapping(uint256 => uint256[]) private _bonus;

    /** @return length fo APR bonuses (for nft-id) */
    function bonusesLength(uint256 nftId) external view returns (uint256) {
        uint256 id = _aprBonusId(nftId);
        return bonuses[id].length;
    }

    /** @return duration weighted mean of APR bonuses (per nft.level) */
    function aprBonusOf(uint256 nftId) public view returns (uint256) {
        uint256 value = aprBonusTargetOf(nftId);
        uint256 id = _aprBonusId(nftId);
        if (bonuses[id].length > 0) {
            uint256 stamp = block.timestamp;
            uint256 point = bonuses[id].meanOf(stamp, value);
            return (point * aprBonusTargetOf(nftId)) / value;
        }
        return value;
    }

    /** @return target for annualized percentage rate bonus */
    function aprBonusTargetOf(uint256 nftId) public view returns (uint256) {
        return aprBonusTargetOf(nftId, getAPRBonus(nftId));
    }

    /** @return target for annualized percentage rate bonus */
    function aprBonusTargetOf(uint256 nftId, uint256[] memory array) private view returns (uint256) {
        uint256 nowYear = _ppt.year();
        uint256 nftYear = _ppt.yearOf(nftId);
        if (nowYear > nftYear || nowYear == nftYear) {
            return Polynomial(array).eval3(nowYear - nftYear);
        }
        return 0;
    }

    /** annual percentage bonus: 1.0000[‱] (per nft.year) */
    uint256 private constant APR_BONUS_MUL = 10_000;
    uint256 private constant APR_BONUS_DIV = 1;

    /** @return APR bonus parameters */
    function getAPRBonus(uint256 nftId) public view returns (uint256[] memory) {
        uint256 id = _aprBonusId(nftId);
        if (_bonus[id].length > 0) {
            return _bonus[id];
        }
        uint256[] memory array = new uint256[](3);
        array[1] = APR_BONUS_DIV;
        array[2] = APR_BONUS_MUL;
        return array;
    }

    /** set APR bonus parameters */
    function setAPRBonus(uint256 nftId, uint256[] memory array) public onlyRole(APR_BONUS_ROLE) {
        Rpp.checkArray(array);
        // fixed nft-id as anchor
        uint256 id = _aprBonusId(nftId);
        // check APR bonus reparametrization of value
        uint256 nextValue = aprBonusTargetOf(id, array);
        uint256 currValue = aprBonusTargetOf(id);
        Rpp.checkValue(nextValue, currValue);
        // check APR bonus reparametrization of stamp
        Integrator.Item memory last = bonuses[id].lastOf();
        Rpp.checkStamp(block.timestamp, last.stamp);
        // append (stamp, apr-bonus-of[nft-id]) to integrator
        bonuses[id].append(block.timestamp, currValue);
        // all requirements satisfied: use array
        _bonus[id] = array;
    }

    /** batch-set APR bonus parameters */
    function setAPRBonusBatch(uint256[] memory nftIds, uint256[] memory array) external onlyRole(APR_BONUS_ROLE) {
        for (uint256 i = 0; i < nftIds.length; i++) {
            setAPRBonus(nftIds[i], array);
        }
    }

    /** @return apr-bonus-id */
    function _aprBonusId(uint256) private view returns (uint256) {
        return _ppt.idBy(2021, 3);
    }
}
