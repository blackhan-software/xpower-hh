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

    /** map of MOE indices: prefix => index */
    mapping(uint256 => uint256) private _moeIndex;
    /** map of SOV indices: prefix => index */
    mapping(uint256 => uint256) private _sovIndex;

    /** (burnable) proof-of-work tokens */
    XPower[] private _moe;
    /** (burnable) *aged* XPower tokens */
    APower[] private _sov;
    /** staked proof-of-work NFTs */
    XPowerPpt private _ppt;

    /** map of rewards claimed: account => nft-id => amount */
    mapping(address => mapping(uint256 => uint256)) private _claimed;

    /** @param moeLink address of contract for XPower tokens */
    /** @param sovLink address of contract for APower tokens */
    /** @param pptLink address of contract for staked NFTs */
    constructor(address[] memory moeLink, address[] memory sovLink, address pptLink) {
        _moe = new XPower[](moeLink.length);
        for (uint256 i = 0; i < moeLink.length; i++) {
            XPower moe = XPower(moeLink[i]);
            _moeIndex[moe.prefix()] = i;
            _moe[i] = moe;
        }
        _sov = new APower[](sovLink.length);
        for (uint256 i = 0; i < sovLink.length; i++) {
            APower sov = APower(sovLink[i]);
            _sovIndex[sov.prefix()] = i;
            _sov[i] = sov;
        }
        _ppt = XPowerPpt(pptLink);
    }

    /** @return MOE balance of available tokens */
    function moeBalanceOf(uint256 index) external view returns (uint256) {
        return _moe[index].balanceOf((address)(this));
    }

    /** @return index of MOE token address */
    function moeIndexOf(address moe) external view returns (uint256) {
        return _moeIndex[XPower(moe).prefix()];
    }

    /** emitted on claiming NFT reward */
    event Claim(address account, uint256 nftId, uint256 amount);

    /** claim APower tokens (for account and nft-id) */
    function claimFor(address account, uint256 nftId) external {
        uint256 amount = claimableFor(account, nftId);
        require(amount > 0, "nothing claimable");
        _claimed[account][nftId] += amount;
        XPower moe = _moeOf(_ppt.prefixOf(nftId));
        APower sov = _sovOf(_ppt.prefixOf(nftId));
        moe.increaseAllowance((address)(sov), amount);
        sov.mint(account, amount);
        emit Claim(account, nftId, amount);
    }

    /** emitted on claiming NFT rewards */
    event ClaimBatch(address account, uint256[] nftIds, uint256[] amounts);

    /** claim APower tokens (for account and nft-ids) */
    function claimForBatch(address account, uint256[] memory nftIds) external {
        require(Array.unique(nftIds), "unsorted or duplicate ids");
        uint256[] memory amounts = claimableForBatch(account, nftIds);
        uint256[] memory subsums = new uint256[](_lastPrefix(nftIds));
        for (uint256 i = 0; i < nftIds.length; i++) {
            require(amounts[i] > 0, "nothing claimable");
            _claimed[account][nftIds[i]] += amounts[i];
            uint256 prefix = _ppt.prefixOf(nftIds[i]);
            subsums[prefix - 1] += amounts[i];
        }
        for (uint256 i = 0; i < subsums.length; i++) {
            if (subsums[i] == 0) {
                continue;
            }
            XPower moe = _moeOf(i + 1);
            APower sov = _sovOf(i + 1);
            moe.increaseAllowance((address)(sov), subsums[i]);
            sov.mint(account, subsums[i]);
        }
        emit ClaimBatch(account, nftIds, amounts);
    }

    /** @return last prefix (for nft-ids) */
    function _lastPrefix(uint256[] memory nftIds) private view returns (uint256) {
        return nftIds.length > 0 ? _ppt.prefixOf(nftIds[nftIds.length - 1]) : 0;
    }

    /** @return claimed amount (for account and nft-id) */
    function claimedFor(address account, uint256 nftId) public view returns (uint256) {
        return _claimed[account][nftId];
    }

    /** @return claimed amount (for account and nft-ids) */
    function claimedForBatch(address account, uint256[] memory nftIds) public view returns (uint256[] memory) {
        uint256[] memory claimed = new uint256[](nftIds.length);
        for (uint256 i = 0; i < nftIds.length; i++) {
            claimed[i] = claimedFor(account, nftIds[i]);
        }
        return claimed;
    }

    /** @return claimable amount (for account and nft-id) */
    function claimableFor(address account, uint256 nftId) public view returns (uint256) {
        uint256 claimed = claimedFor(account, nftId);
        uint256 reward = rewardOf(account, nftId);
        if (reward > claimed) {
            return reward - claimed;
        }
        return 0;
    }

    /** @return claimable amount (for account and nft-ids) */
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

    /** @return reward (for account and nft-id) */
    function rewardOf(address account, uint256 nftId) public view returns (uint256) {
        uint256 rate = rateOf(nftId);
        uint256 age = _ppt.ageOf(account, nftId);
        uint256 denomination = _ppt.denominationOf(_ppt.levelOf(nftId));
        uint256 reward = (rate * age * denomination) / (1_000_000 * Constants.CENTURY);
        return reward * 10 ** _moeOf(_ppt.prefixOf(nftId)).decimals();
    }

    /** @return reward (for account and nft-ids) */
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

    /** @return length of APRs (for nft-id) */
    function aprsLength(uint256 nftId) external view returns (uint256) {
        uint256 id = _aprId(nftId);
        return aprs[id].length;
    }

    /** @return duration weighted mean of APRs (for nft-id) */
    function aprOf(uint256 nftId) public view returns (uint256) {
        uint256 value = aprTargetOf(nftId);
        uint256 id = _aprId(nftId);
        if (aprs[id].length > 0) {
            return aprs[id].meanOf(block.timestamp, value);
        }
        return value;
    }

    /** @return target for annualized percentage rate (for nft-id) */
    function aprTargetOf(uint256 nftId) public view returns (uint256) {
        return aprTargetOf(nftId, getAPR(nftId));
    }

    /** @return target for annualized percentage rate (for nft-id and array) */
    function aprTargetOf(uint256 nftId, uint256[] memory array) private view returns (uint256) {
        return Polynomial(array).eval4Clamped(_ppt.levelOf(nftId));
    }

    /** annual percentage rate: 1.000000[%] (per nft.level) */
    uint256 private constant APR_MUL = 1_000_000;
    uint256 private constant APR_DIV = 3;

    /** @return APR parameters (for nft-id) */
    function getAPR(uint256 nftId) public view returns (uint256[] memory) {
        uint256 id = _aprId(nftId);
        if (_apr[id].length > 0) {
            return _apr[id];
        }
        uint256[] memory array = new uint256[](4);
        array[3] = APR_MUL;
        array[2] = APR_DIV;
        return array;
    }

    /** set APR parameters (for nft-id) */
    function setAPR(uint256 nftId, uint256[] memory array) public onlyRole(APR_ROLE) {
        Rpp.checkArray(array);
        // fixed nft-id as anchor
        uint256 id = _aprId(nftId);
        // check APR reparametrization of value
        uint256 nextValue = aprTargetOf(id, array);
        uint256 currValue = aprTargetOf(id);
        Rpp.checkValue(nextValue, currValue);
        // check APR reparametrization of stamp
        uint256 lastStamp = aprs[id].lastOf().stamp;
        uint256 currStamp = block.timestamp;
        Rpp.checkStamp(currStamp, lastStamp);
        // append (stamp, apr-of[nft-id]) to integrator
        aprs[id].append(currStamp, currValue);
        // all requirements satisfied: use array
        _apr[id] = array;
    }

    /** batch-set APR parameters (for nft-ids) */
    function setAPRBatch(uint256[] memory nftIds, uint256[] memory array) external onlyRole(APR_ROLE) {
        for (uint256 i = 0; i < nftIds.length; i++) {
            setAPR(nftIds[i], array);
        }
    }

    /** @return apr-id (for nft-id: i.e. for nft-{prefix, level} */
    function _aprId(uint256 nftId) private view returns (uint256) {
        return _ppt.idBy(2021, _ppt.levelOf(nftId), _ppt.prefixOf(nftId));
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

    /** @return target for annualized percentage rate bonus (for nft-id) */
    function aprBonusTargetOf(uint256 nftId) public view returns (uint256) {
        return aprBonusTargetOf(nftId, getAPRBonus(nftId));
    }

    /** @return target for annualized percentage rate bonus (for nft-id and array) */
    function aprBonusTargetOf(uint256 nftId, uint256[] memory array) private view returns (uint256) {
        uint256 nowYear = _ppt.year();
        uint256 nftYear = _ppt.yearOf(nftId);
        if (nowYear > nftYear || nowYear == nftYear) {
            return Polynomial(array).eval4Clamped(nowYear - nftYear);
        }
        return 0;
    }

    /** annual percentage bonus: 1.0000[‱] (per nft.year) */
    uint256 private constant APR_BONUS_MUL = 10_000;
    uint256 private constant APR_BONUS_DIV = 1;

    /** @return APR bonus parameters (for nft-id) */
    function getAPRBonus(uint256 nftId) public view returns (uint256[] memory) {
        uint256 id = _aprBonusId(nftId);
        if (_bonus[id].length > 0) {
            return _bonus[id];
        }
        uint256[] memory array = new uint256[](4);
        array[3] = APR_BONUS_MUL;
        array[2] = APR_BONUS_DIV;
        return array;
    }

    /** set APR bonus parameters (for nft-id) */
    function setAPRBonus(uint256 nftId, uint256[] memory array) public onlyRole(APR_BONUS_ROLE) {
        Rpp.checkArray(array);
        // fixed nft-id as anchor
        uint256 id = _aprBonusId(nftId);
        // check APR bonus reparametrization of value
        uint256 nextValue = aprBonusTargetOf(id, array);
        uint256 currValue = aprBonusTargetOf(id);
        Rpp.checkValue(nextValue, currValue);
        // check APR bonus reparametrization of stamp
        uint256 lastStamp = bonuses[id].lastOf().stamp;
        uint256 currStamp = block.timestamp;
        Rpp.checkStamp(currStamp, lastStamp);
        // append (stamp, apr-bonus-of[nft-id]) to integrator
        bonuses[id].append(currStamp, currValue);
        // all requirements satisfied: use array
        _bonus[id] = array;
    }

    /** batch-set APR bonus parameters (for nft-ids) */
    function setAPRBonusBatch(uint256[] memory nftIds, uint256[] memory array) external onlyRole(APR_BONUS_ROLE) {
        for (uint256 i = 0; i < nftIds.length; i++) {
            setAPRBonus(nftIds[i], array);
        }
    }

    /** @return apr-bonus-id (for nft-id: i.e. for nft-prefix *only*) */
    function _aprBonusId(uint256 nftId) private view returns (uint256) {
        return _ppt.idBy(2021, 3, _ppt.prefixOf(nftId));
    }

    /** @return MOE token for prefix */
    function _moeOf(uint256 moePrefix) private view returns (XPower) {
        return _moe[_moeIndex[moePrefix]];
    }

    /** @return SOV token for prefix */
    function _sovOf(uint256 sovPrefix) private view returns (APower) {
        return _sov[_sovIndex[sovPrefix]];
    }
}
