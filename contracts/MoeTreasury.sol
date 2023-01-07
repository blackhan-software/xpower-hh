// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
// solhint-disable reason-string
pragma solidity ^0.8.0;

import "./APower.sol";
import "./XPower.sol";
import "./XPowerPpt.sol";
import "./libs/Interpolators.sol";

/**
 * Treasury to claim (MoE) tokens for staked XPowerNft(s).
 */
contract MoeTreasury is MoeTreasurySupervised {
    using Polynomials for Polynomial;
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

    /** century in seconds (approximation) */
    uint256 private constant CENTUM = 365_25 days;
    /** single year in seconds (approximation) */
    uint256 private constant ANNUM = CENTUM / 100;
    /** single month in seconds (approximation) */
    uint256 private constant MONTH = ANNUM / 12;

    /** @param moeLink address of contract for XPower tokens */
    /** @param sovLink address of contract for APower tokens */
    /** @param pptLink address of contract for staked NFTs */
    constructor(address[] memory moeLink, address[] memory sovLink, address pptLink) {
        require(moeLink.length > 0 && moeLink.length == sovLink.length, "invalid moeLink.length");
        require(sovLink.length > 0 && sovLink.length == moeLink.length, "invalid sovLink.length");
        _moe = new XPower[](moeLink.length);
        for (uint256 i = 0; i < moeLink.length; i++) {
            XPower moe = XPower(moeLink[i]);
            assert(moe.prefix() == i + 1);
            _moe[i] = moe;
        }
        _sov = new APower[](sovLink.length);
        for (uint256 i = 0; i < sovLink.length; i++) {
            APower sov = APower(sovLink[i]);
            assert(sov.prefix() == i + 1);
            _sov[i] = sov;
        }
        _ppt = XPowerPpt(pptLink);
    }

    /** @return MOE balance of available tokens */
    function moeBalance(uint256 index) public view returns (uint256) {
        return _moe[index].balanceOf((address)(this));
    }

    /** @return index of MOE token address */
    function moeIndexOf(address moe) public pure returns (uint256) {
        return XPower(moe).prefix() - 1;
    }

    /** @return SOV balance of available tokens */
    function sovBalance(uint256 index) public view returns (uint256) {
        return _sov[index].balanceOf((address)(this));
    }

    /** @return index of SOV token address */
    function sovIndexOf(address sov) public view returns (uint256) {
        return APower(sov).prefix() - 1;
    }

    /** emitted on claiming NFT reward */
    event Claim(address account, uint256 nftId, uint256 amount);

    /** claim APower tokens for given account and nft-id */
    function claimFor(address account, uint256 nftId) public {
        uint256 amount = claimableFor(account, nftId);
        require(amount > 0, "nothing claimable");
        _claimed[account][nftId] += amount;
        _claimedTotal[nftId] += amount;
        XPower moe = _moe[_indexOf(nftId)];
        APower sov = _sov[_indexOf(nftId)];
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
            XPower moe = _moe[_indexOf(nftIds[i])];
            APower sov = _sov[_indexOf(nftIds[i])];
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
            } else {
                pending[i] = 0;
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
            } else {
                pendingTotal[i] = 0;
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
        uint256 reward = (apr * age * denomination) / (1_000 * CENTUM);
        uint256 rewardBonus = (aprBonus * age * denomination) / (1_000 * CENTUM);
        return (reward + rewardBonus) * 10 ** _moe[_indexOf(nftId)].decimals();
    }

    /** @return reward total of tokens for given nft-id */
    function totalRewardOf(uint256 nftId) public view returns (uint256) {
        uint256 age = _ppt.totalAgeOf(nftId);
        uint256 denomination = _ppt.denominationOf(_ppt.levelOf(nftId));
        uint256 apr = aprOf(nftId);
        uint256 aprBonus = aprBonusOf(nftId);
        uint256 reward = (apr * age * denomination) / (1_000 * CENTUM);
        uint256 rewardBonus = (aprBonus * age * denomination) / (1_000 * CENTUM);
        return (reward + rewardBonus) * 10 ** _moe[_indexOf(nftId)].decimals();
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

    /** time-weighted average of APR: nft-id => value */
    mapping(uint256 => uint256) private _aprSourceValue;
    /** timestamp for average of APR: nft-id => timestamp */
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
        uint256 tgtStamp = srcStamp + ANNUM;
        uint256 srcValue = _aprSourceValue[nftId];
        uint256 tgtValue = aprTargetOf(nftId);
        return Interpolators.linear(srcStamp, srcValue, tgtStamp, tgtValue, nowStamp);
    }

    /** @return target for annualized percentage rate (per nft.level) */
    function aprTargetOf(uint256 nftId) public view returns (uint256) {
        uint256 nftYear = _ppt.yearOf(nftId);
        uint256 nftLevel = _ppt.levelOf(nftId);
        uint256 nftPrefix = _ppt.prefixOf(nftId);
        return Polynomial(getAPR(nftPrefix, nftYear)).evalClamped(nftLevel);
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
    function setAPR(uint256 prefix, uint256 year, uint256[] memory array) public onlyRole(APR_ROLE) {
        require(array.length == 6, "invalid array.length");
        require(array[2] > 0, "invalid array[2] entry");
        for (uint256 level = 0; level < 100; level += 3) {
            uint256 nftId = _ppt.idBy(year, level, prefix);
            _aprSourceValue[nftId] = aprOf(nftId);
            _aprSourceStamp[nftId] = block.timestamp;
        }
        _apr[prefix][year] = array;
    }

    /** time-weighted average of APR bonus: nft-id => value */
    mapping(uint256 => uint256) private _bonusSourceValue;
    /** timestamp for average of APR bonus: nft-id => timestamp */
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
        uint256 tgtStamp = srcStamp + ANNUM;
        uint256 srcValue = _bonusSourceValue[nftId];
        uint256 tgtValue = aprBonusTargetOf(nftId);
        return Interpolators.linear(srcStamp, srcValue, tgtStamp, tgtValue, nowStamp);
    }

    /** @return target for annualized percentage rate bonus (per nft.year) */
    function aprBonusTargetOf(uint256 nftId) public view returns (uint256) {
        uint256 nowYear = _ppt.year();
        uint256 nftYear = _ppt.yearOf(nftId);
        uint256 nftPrefix = _ppt.prefixOf(nftId);
        uint256 ageYear = nowYear > nftYear ? nowYear - nftYear : 0;
        return Polynomial(getAPRBonus(nftPrefix, nftYear)).evalClamped(ageYear);
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
        require(array[2] > 0, "invalid array[2] entry");
        for (uint256 nftLevel = 0; nftLevel < 100; nftLevel += 3) {
            uint256 nftId = _ppt.idBy(nftYear, nftLevel, nftPrefix);
            _bonusSourceValue[nftId] = aprBonusOf(nftId);
            _bonusSourceStamp[nftId] = block.timestamp;
        }
        _bonus[nftPrefix][nftYear] = array;
    }

    /** @return index *associated* with nft-id */
    function _indexOf(uint256 nftId) private view returns (uint256) {
        return _ppt.prefixOf(nftId) - 1;
    }
}
