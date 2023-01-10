// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
// solhint-disable reason-string
pragma solidity ^0.8.0;

import "./APower.sol";
import "./XPower.sol";
import "./XPowerPpt.sol";

import "./libs/Constants.sol";
import "./libs/Interpolators.sol";

/**
 * Treasury to claim (MoE) tokens for staked XPowerNft(s).
 */
contract MoeTreasury is MoeTreasurySupervised {
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
    /** map of rewards claimed total: nft-id => amount */
    mapping(uint256 => uint256) private _claimedTotal;

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

    /** claim APower tokens for given account and nft-id */
    function claimFor(address account, uint256 nftId) public {
        uint256 amount = claimableFor(account, nftId);
        require(amount > 0, "nothing claimable");
        _claimed[account][nftId] += amount;
        _claimedTotal[nftId] += amount;
        XPower moe = _moeOf(_ppt.prefixOf(nftId));
        APower sov = _sovOf(_ppt.prefixOf(nftId));
        moe.increaseAllowance((address)(sov), amount);
        sov.mint(account, amount);
        emit Claim(account, nftId, amount);
    }

    /** emitted on claiming NFT rewards */
    event ClaimBatch(address account, uint256[] nftIds, uint256[] amounts);

    /** claim APower tokens for given account and nft-ids */
    function claimForBatch(address account, uint256[] memory nftIds) public {
        uint256[] memory amounts = claimableForBatch(account, nftIds);
        for (uint256 i = 0; i < nftIds.length; i++) {
            require(amounts[i] > 0, "nothing claimable");
            _claimed[account][nftIds[i]] += amounts[i];
            _claimedTotal[nftIds[i]] += amounts[i];
        }
        for (uint256 i = 0; i < nftIds.length; i++) {
            XPower moe = _moeOf(_ppt.prefixOf(nftIds[i]));
            APower sov = _sovOf(_ppt.prefixOf(nftIds[i]));
            moe.increaseAllowance((address)(sov), amounts[i]);
            sov.mint(account, amounts[i]);
        }
        emit ClaimBatch(account, nftIds, amounts);
    }

    /** @return claimed amount of tokens for given account and nft-id */
    function claimedFor(address account, uint256 nftId) public view returns (uint256) {
        return _claimed[account][nftId];
    }

    /** @return claimed total amount of tokens for nft-id */
    function totalClaimedFor(uint256 nftId) public view returns (uint256) {
        return _claimedTotal[nftId];
    }

    /** @return claimed amount of tokens for given account and nft-ids */
    function claimedForBatch(address account, uint256[] memory nftIds) public view returns (uint256[] memory) {
        uint256[] memory claimed = new uint256[](nftIds.length);
        for (uint256 i = 0; i < nftIds.length; i++) {
            claimed[i] = claimedFor(account, nftIds[i]);
        }
        return claimed;
    }

    /** @return claimed total amount of tokens for given nft-ids */
    function totalClaimedForBatch(uint256[] memory nftIds) public view returns (uint256[] memory) {
        uint256[] memory claimedTotal = new uint256[](nftIds.length);
        for (uint256 i = 0; i < nftIds.length; i++) {
            claimedTotal[i] = totalClaimedFor(nftIds[i]);
        }
        return claimedTotal;
    }

    /** @return claimable amount of tokens for given account and nft-id */
    function claimableFor(address account, uint256 nftId) public view returns (uint256) {
        uint256 claimed = claimedFor(account, nftId);
        uint256 reward = rewardOf(account, nftId);
        if (reward > claimed) {
            return reward - claimed;
        }
        return 0;
    }

    /** @return claimable total amount of tokens for given nft-id */
    function totalClaimableFor(uint256 nftId) public view returns (uint256) {
        uint256 claimedTotal = totalClaimedFor(nftId);
        uint256 rewardTotal = totalRewardOf(nftId);
        if (rewardTotal > claimedTotal) {
            return rewardTotal - claimedTotal;
        }
        return 0;
    }

    /** @return claimable amount of tokens for given account and nft-ids */
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

    /** @return claimable total amount of tokens for given nft-ids */
    function totalClaimableForBatch(uint256[] memory nftIds) public view returns (uint256[] memory) {
        uint256[] memory claimedTotal = totalClaimedForBatch(nftIds);
        uint256[] memory rewardsTotal = totalRewardOfBatch(nftIds);
        uint256[] memory pendingTotal = new uint256[](nftIds.length);
        for (uint256 i = 0; i < nftIds.length; i++) {
            if (rewardsTotal[i] > claimedTotal[i]) {
                pendingTotal[i] = rewardsTotal[i] - claimedTotal[i];
            }
        }
        return pendingTotal;
    }

    /** @return reward of tokens for given account and nft-id */
    function rewardOf(address account, uint256 nftId) public view returns (uint256) {
        uint256 age = _ppt.ageOf(account, nftId);
        uint256 denomination = _ppt.denominationOf(_ppt.levelOf(nftId));
        uint256 apr = aprOf(nftId);
        uint256 aprBonus = aprBonusOf(nftId);
        uint256 reward = (apr * age * denomination) / (1_000 * Constants.CENTURY);
        uint256 rewardBonus = (aprBonus * age * denomination) / (1_000 * Constants.CENTURY);
        return (reward + rewardBonus) * 10 ** _moeOf(_ppt.prefixOf(nftId)).decimals();
    }

    /** @return reward total of tokens for given nft-id */
    function totalRewardOf(uint256 nftId) public view returns (uint256) {
        uint256 age = _ppt.totalAgeOf(nftId);
        uint256 denomination = _ppt.denominationOf(_ppt.levelOf(nftId));
        uint256 apr = aprOf(nftId);
        uint256 aprBonus = aprBonusOf(nftId);
        uint256 reward = (apr * age * denomination) / (1_000 * Constants.CENTURY);
        uint256 rewardBonus = (aprBonus * age * denomination) / (1_000 * Constants.CENTURY);
        return (reward + rewardBonus) * 10 ** _moeOf(_ppt.prefixOf(nftId)).decimals();
    }

    /** @return reward of tokens for given account and nft-ids */
    function rewardOfBatch(address account, uint256[] memory nftIds) public view returns (uint256[] memory) {
        uint256[] memory rewards = new uint256[](nftIds.length);
        for (uint256 i = 0; i < nftIds.length; i++) {
            rewards[i] = rewardOf(account, nftIds[i]);
        }
        return rewards;
    }

    /** @return reward total of tokens for given nft-ids */
    function totalRewardOfBatch(uint256[] memory nftIds) public view returns (uint256[] memory) {
        uint256[] memory rewardsTotal = new uint256[](nftIds.length);
        for (uint256 i = 0; i < nftIds.length; i++) {
            rewardsTotal[i] = totalRewardOf(nftIds[i]);
        }
        return rewardsTotal;
    }

    /** interpolation anchor of APR: nft-id => value */
    mapping(uint256 => uint256) private _aprSourceValue;
    /** interpolation anchor of APR: nft-id => timestamp */
    mapping(uint256 => uint256) private _aprSourceStamp;
    /** parametrization of APR: nft-{prefix, year} => coefficients */
    mapping(uint256 => mapping(uint256 => uint256[])) private _apr;

    /** @return interpolated APR w/1-year lag (per nft.level) */
    function aprOf(uint256 nftId) public view returns (uint256) {
        if (_aprSourceStamp[nftId] == 0) {
            return aprTargetOf(nftId);
        }
        uint256 nowStamp = block.timestamp;
        uint256 srcStamp = _aprSourceStamp[nftId];
        uint256 tgtStamp = srcStamp + Constants.YEAR;
        uint256 srcValue = _aprSourceValue[nftId];
        uint256 tgtValue = aprTargetOf(nftId);
        return Interpolators.linear(srcStamp, srcValue, tgtStamp, tgtValue, nowStamp);
    }

    /** @return target for annualized percentage rate (per nft.level) */
    function aprTargetOf(uint256 nftId) public view returns (uint256) {
        uint256 nftYear = _ppt.yearOf(nftId);
        uint256 nftPrefix = _ppt.prefixOf(nftId);
        return aprTargetOf(nftId, getAPR(nftPrefix, nftYear));
    }

    /** @return target for annualized percentage rate (per nft.level & parametrization) */
    function aprTargetOf(uint256 nftId, uint256[] memory array) private view returns (uint256) {
        return Polynomial(array).evalClamped(_ppt.levelOf(nftId));
    }

    /** @return APR parameters (for given nft-{prefix, year}) */
    function getAPR(uint256 nftPrefix, uint256 nftYear) public view returns (uint256[] memory) {
        if (_apr[nftPrefix][nftYear].length > 0) {
            return _apr[nftPrefix][nftYear];
        }
        uint256[] memory apr = new uint256[](6);
        apr[3] = 1000;
        apr[2] = 3;
        return apr;
    }

    /** set APR parameters for retargeting (for given nft-{prefix, year}) */
    function setAPR(uint256 nftPrefix, uint256 nftYear, uint256[] memory array) public onlyRole(APR_ROLE) {
        require(array.length == 6, "invalid array.length");
        // eliminate possibility of division-by-zero
        require(array[2] > 0, "invalid array[2] == 0");
        // eliminate possibility of all-zero values
        require(array[3] > 0, "invalid array[3] == 0");
        for (uint256 nftLevel = 0; nftLevel < 100; nftLevel += 3) {
            uint256 nftId = _ppt.idBy(nftYear, nftLevel, nftPrefix);
            // check APR reparametrization of value
            uint256 lastValue = aprTargetOf(nftId);
            uint256 nextValue = aprTargetOf(nftId, array);
            _checkAPRValue(nextValue, lastValue);
            _aprSourceValue[nftId] = aprOf(nftId);
            // check APR reparametrization of stamp
            uint256 lastStamp = _aprSourceStamp[nftId];
            uint256 nextStamp = block.timestamp;
            _checkAPRStamp(nextStamp, lastStamp);
            _aprSourceStamp[nftId] = nextStamp;
        }
        _apr[nftPrefix][nftYear] = array;
    }

    /** validate APR change: 0.5 <= next / last <= 2.0 or next <= 1.000[%] */
    function _checkAPRValue(uint256 nextValue, uint256 lastValue) private pure {
        if (nextValue < lastValue) {
            require(lastValue <= 2 * nextValue, "invalid change: too small");
        }
        if (nextValue > lastValue && lastValue > 0) {
            require(nextValue <= 2 * lastValue, "invalid change: too large");
        }
        if (nextValue > lastValue && lastValue == 0) {
            require(nextValue <= 1_000, "invalid change: too large");
        }
    }

    /** validate APR change: invocation frequency at most at once per month */
    function _checkAPRStamp(uint256 nextStamp, uint256 lastStamp) private pure {
        if (lastStamp > 0) {
            require(nextStamp - lastStamp > Constants.MONTH, "invalid change: too frequent");
        }
    }

    /** interpolation anchor of APR bonus: nft-id => value */
    mapping(uint256 => uint256) private _bonusSourceValue;
    /** interpolation anchor of APR bonus: nft-id => timestamp */
    mapping(uint256 => uint256) private _bonusSourceStamp;
    /** parametrization of APR bonus: nft-{prefix, year} => coefficients */
    mapping(uint256 => mapping(uint256 => uint256[])) private _bonus;

    /** @return interpolated APR bonus w/1-year lag (per nft.level) */
    function aprBonusOf(uint256 nftId) public view returns (uint256) {
        if (_bonusSourceStamp[nftId] == 0) {
            return aprBonusTargetOf(nftId);
        }
        uint256 nowStamp = block.timestamp;
        uint256 srcStamp = _bonusSourceStamp[nftId];
        uint256 tgtStamp = srcStamp + Constants.YEAR;
        uint256 srcValue = _bonusSourceValue[nftId];
        uint256 tgtValue = aprBonusTargetOf(nftId);
        return Interpolators.linear(srcStamp, srcValue, tgtStamp, tgtValue, nowStamp);
    }

    /** @return target for annualized percentage rate bonus (per nft.year) */
    function aprBonusTargetOf(uint256 nftId) public view returns (uint256) {
        uint256 nftYear = _ppt.yearOf(nftId);
        uint256 nftPrefix = _ppt.prefixOf(nftId);
        return aprBonusTargetOf(nftId, getAPRBonus(nftPrefix, nftYear));
    }

    /** @return target for annualized percentage rate bonus (per nft.year & parametrization) */
    function aprBonusTargetOf(uint256 nftId, uint256[] memory array) private view returns (uint256) {
        uint256 nowYear = _ppt.year();
        uint256 nftYear = _ppt.yearOf(nftId);
        uint256 ageYear = nowYear > nftYear ? nowYear - nftYear : 0;
        return Polynomial(array).evalClamped(ageYear);
    }

    /** @return APR bonus parameters (for given nft-{prefix, year}) */
    function getAPRBonus(uint256 nftPrefix, uint256 nftYear) public view returns (uint256[] memory) {
        if (_bonus[nftPrefix][nftYear].length > 0) {
            return _bonus[nftPrefix][nftYear];
        }
        uint256[] memory bonus = new uint256[](6);
        bonus[3] = 10;
        bonus[2] = 1;
        return bonus;
    }

    /** set APR bonus parameters for retargeting (for given nft-{prefix, year}) */
    function setAPRBonus(uint256 nftPrefix, uint256 nftYear, uint256[] memory array) public onlyRole(APR_BONUS_ROLE) {
        require(array.length == 6, "invalid array.length");
        // eliminate possibility of division-by-zero
        require(array[2] > 0, "invalid array[2] == 0");
        // eliminate possibility of all-zero values
        require(array[3] > 0, "invalid array[3] == 0");
        for (uint256 nftLevel = 0; nftLevel < 100; nftLevel += 3) {
            uint256 nftId = _ppt.idBy(nftYear, nftLevel, nftPrefix);
            // check APR bonus reparametrization of value
            uint256 lastValue = aprBonusTargetOf(nftId);
            uint256 nextValue = aprBonusTargetOf(nftId, array);
            _checkAPRBonusValue(nextValue, lastValue);
            _bonusSourceValue[nftId] = aprBonusOf(nftId);
            // check APR bonus reparametrization of stamp
            uint256 lastStamp = _bonusSourceStamp[nftId];
            uint256 nextStamp = block.timestamp;
            _checkAPRBonusStamp(nextStamp, lastStamp);
            _bonusSourceStamp[nftId] = nextStamp;
        }
        _bonus[nftPrefix][nftYear] = array;
    }

    /** validate APR bonus change: 0.5 <= next / last <= 2.0 or next <= 0.010[%] */
    function _checkAPRBonusValue(uint256 nextValue, uint256 lastValue) private pure {
        if (nextValue < lastValue) {
            require(lastValue <= 2 * nextValue, "invalid change: too small");
        }
        if (nextValue > lastValue && lastValue > 0) {
            require(nextValue <= 2 * lastValue, "invalid change: too large");
        }
        if (nextValue > lastValue && lastValue == 0) {
            require(nextValue <= 10, "invalid change: too large");
        }
    }

    /** validate APR bonus change: invocation frequency at most at once per month */
    function _checkAPRBonusStamp(uint256 nextStamp, uint256 lastStamp) private pure {
        if (lastStamp > 0) {
            require(nextStamp - lastStamp > Constants.MONTH, "invalid change: too frequent");
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
