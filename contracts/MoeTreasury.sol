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
    function moeBalanceOf(uint256 index) public view returns (uint256) {
        return _moe[index].balanceOf((address)(this));
    }

    /** @return index of MOE token address */
    function moeIndexOf(address moe) public view returns (uint256) {
        return _moeIndex[XPower(moe).prefix()];
    }

    /** emitted on claiming NFT reward */
    event Claim(address account, uint256 nftId, uint256 amount);

    /** claim APower tokens (for account and nft-id) */
    function claimFor(address account, uint256 nftId) public {
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
    function claimForBatch(address account, uint256[] memory nftIds) public {
        require(Array.unique(nftIds), "unsorted or duplicate ids");
        uint256[] memory amounts = claimableForBatch(account, nftIds);
        for (uint256 i = 0; i < nftIds.length; i++) {
            require(amounts[i] > 0, "nothing claimable");
            _claimed[account][nftIds[i]] += amounts[i];
        }
        for (uint256 i = 0; i < nftIds.length; i++) {
            XPower moe = _moeOf(_ppt.prefixOf(nftIds[i]));
            APower sov = _sovOf(_ppt.prefixOf(nftIds[i]));
            moe.increaseAllowance((address)(sov), amounts[i]);
            sov.mint(account, amounts[i]);
        }
        emit ClaimBatch(account, nftIds, amounts);
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
        uint256 reward = (rate * age * denomination) / (1_000 * Constants.CENTURY);
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
    function rateTargetOf(uint256 nftId) public view returns (uint256) {
        return aprTargetOf(nftId) + aprBonusTargetOf(nftId);
    }

    /** integrator for APRs: nft-prefix => [(stamp, value)] */
    mapping(uint256 => Integrator.Item[]) public aprs;
    /** parametrization of APR: nft-prefix => coefficients */
    mapping(uint256 => uint256[]) private _apr;

    /** @return duration weighted mean of APRs (per nft.level) */
    function aprOf(uint256 nftId) public view returns (uint256) {
        uint256 nftPrefix = _ppt.prefixOf(nftId);
        if (aprs[nftPrefix].length == 0) {
            return aprTargetOf(nftId);
        }
        uint256 stamp = block.timestamp;
        uint256 value = aprTargetOf(_ppt.idBy(2021, 3, nftPrefix));
        uint256 point = aprs[nftPrefix].meanOf(stamp, value);
        return (point * _ppt.levelOf(nftId)) / 3;
    }

    /** @return target for annualized percentage rate (per nft.level) */
    function aprTargetOf(uint256 nftId) public view returns (uint256) {
        return aprTargetOf(nftId, getAPR(_ppt.prefixOf(nftId)));
    }

    /** @return target for annualized percentage rate (per nft.level & parametrization) */
    function aprTargetOf(uint256 nftId, uint256[] memory array) private view returns (uint256) {
        return Polynomial(array).eval4Clamped(_ppt.levelOf(nftId));
    }

    /** annual percentage rate: 1.000[%] (per nft.level) */
    uint256 private constant APR_MUL = 1_000;
    uint256 private constant APR_DIV = 3;

    /** @return APR parameters (for nft-prefix) */
    function getAPR(uint256 nftPrefix) public view returns (uint256[] memory) {
        if (_apr[nftPrefix].length > 0) {
            return _apr[nftPrefix];
        }
        uint256[] memory array = new uint256[](4);
        array[3] = APR_MUL;
        array[2] = APR_DIV;
        return array;
    }

    /** set APR parameters (for nft-prefix) */
    function setAPR(uint256 nftPrefix, uint256[] memory array) public onlyRole(APR_ROLE) {
        Rpp.checkArray(array);
        // fixed nft-id as anchor
        uint256 nftId = _ppt.idBy(2021, 3, nftPrefix);
        // check APR reparametrization of value
        uint256 nextValue = aprTargetOf(nftId, array);
        uint256 currValue = aprTargetOf(nftId);
        Rpp.checkValue(nextValue, currValue);
        // check APR reparametrization of stamp
        uint256 lastStamp = aprs[nftPrefix].lastOf().stamp;
        uint256 currStamp = block.timestamp;
        Rpp.checkStamp(currStamp, lastStamp);
        // append (stamp, apr-of[nft-id]) to integrator
        aprs[nftPrefix].append(currStamp, currValue);
        // all requirements satisfied: use array
        _apr[nftPrefix] = array;
    }

    /** batch-set APR parameters (for nft-prefixes) */
    function setAPRBatch(uint256[] memory nftPrefixes, uint256[] memory array) public onlyRole(APR_ROLE) {
        for (uint256 p = 0; p < nftPrefixes.length; p++) {
            setAPR(nftPrefixes[p], array);
        }
    }

    /** integrator for APR bonuses: nft-prefix => [(stamp, value)] */
    mapping(uint256 => Integrator.Item[]) public bonuses;
    /** parametrization of APR bonus: nft-prefix => coefficients */
    mapping(uint256 => uint256[]) private _bonus;

    /** @return duration weighted mean of APR bonuses (per nft.level) */
    function aprBonusOf(uint256 nftId) public view returns (uint256) {
        uint256 nftPrefix = _ppt.prefixOf(nftId);
        if (bonuses[nftPrefix].length == 0) {
            return aprBonusTargetOf(nftId);
        }
        uint256 stamp = block.timestamp;
        uint256 value = aprBonusTargetOf(_ppt.idBy(2021, 3, nftPrefix));
        uint256 point = bonuses[nftPrefix].meanOf(stamp, value);
        return (point * aprBonusTargetOf(nftId)) / value;
    }

    /** @return target for annualized percentage rate bonus (per nft.year) */
    function aprBonusTargetOf(uint256 nftId) public view returns (uint256) {
        return aprBonusTargetOf(nftId, getAPRBonus(_ppt.prefixOf(nftId)));
    }

    /** @return target for annualized percentage rate bonus (per nft.year & parametrization) */
    function aprBonusTargetOf(uint256 nftId, uint256[] memory array) private view returns (uint256) {
        uint256 nowYear = _ppt.year();
        uint256 nftYear = _ppt.yearOf(nftId);
        if (nowYear > nftYear || nowYear == nftYear) {
            return Polynomial(array).eval4Clamped(nowYear - nftYear);
        }
        return 0;
    }

    /** annual percentage bonus: 1.0[‱] (per nft.year) */
    uint256 private constant APR_BONUS_MUL = 10;
    uint256 private constant APR_BONUS_DIV = 1;

    /** @return APR bonus parameters (for nft-prefix) */
    function getAPRBonus(uint256 nftPrefix) public view returns (uint256[] memory) {
        if (_bonus[nftPrefix].length > 0) {
            return _bonus[nftPrefix];
        }
        uint256[] memory array = new uint256[](4);
        array[3] = APR_BONUS_MUL;
        array[2] = APR_BONUS_DIV;
        return array;
    }

    /** set APR bonus parameters (for nft-prefix) */
    function setAPRBonus(uint256 nftPrefix, uint256[] memory array) public onlyRole(APR_BONUS_ROLE) {
        Rpp.checkArray(array);
        // fixed nft-id as anchor
        uint256 nftId = _ppt.idBy(2021, 3, nftPrefix);
        // check APR bonus reparametrization of value
        uint256 nextValue = aprBonusTargetOf(nftId, array);
        uint256 currValue = aprBonusTargetOf(nftId);
        Rpp.checkValue(nextValue, currValue);
        // check APR bonus reparametrization of stamp
        uint256 lastStamp = bonuses[nftPrefix].lastOf().stamp;
        uint256 currStamp = block.timestamp;
        Rpp.checkStamp(currStamp, lastStamp);
        // append (stamp, apr-bonus-of[nft-id]) to integrator
        bonuses[nftPrefix].append(currStamp, currValue);
        // all requirements satisfied: use array
        _bonus[nftPrefix] = array;
    }

    /** batch-set APR bonus parameters (for nft-prefixes) */
    function setAPRBonusBatch(uint256[] memory nftPrefixes, uint256[] memory array) public onlyRole(APR_BONUS_ROLE) {
        for (uint256 p = 0; p < nftPrefixes.length; p++) {
            setAPRBonus(nftPrefixes[p], array);
        }
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
