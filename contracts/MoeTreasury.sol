// SPDX-License-Identifier: GPL-3.0
// solhint-disable no-empty-blocks
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./XPower.sol";
import "./XPowerNftStaked.sol";

/**
 * Treasury to claim (MoE) tokens for staked XPowerNft(s).
 */
contract MoeTreasury is Ownable {
    /** (burnable) proof-of-work tokens */
    XPower private _moe;
    /** staked proof-of-work NFTs */
    XPowerNftStaked private _nftStaked;
    /** parametrization of APR */
    uint256[] private _alphas = [0, 1, 1, 0];
    /** parametrization of APR bonus */
    uint256[] private _gammas = [0, 1, 1, 0];
    /** map of rewards claimed: account => nft-id => amount */
    mapping(address => mapping(uint256 => uint256)) private _claimed;
    /** map of rewards claimed total: nft-id => amount */
    mapping(uint256 => uint256) private _claimedTotal;

    /** @param moe address of contract for tokens */
    /** @param nftStaked address of contract for staked NFTs */
    constructor(address moe, address nftStaked) {
        _moe = XPower(moe);
        _nftStaked = XPowerNftStaked(nftStaked);
    }

    /** @return balance of available tokens */
    function balance() public view returns (uint256) {
        address self = (address)(this);
        return _moe.balanceOf(self);
    }

    /** emitted on claiming NFT reward */
    event Claim(address account, uint256 nftId, uint256 amount);

    /** claim tokens for given account and nft-id */
    function claimFor(address account, uint256 nftId) public {
        uint256 amount = claimableFor(account, nftId);
        require(amount > 0, "nothing claimable");
        _claimed[account][nftId] += amount;
        _claimedTotal[nftId] += amount;
        _moe.transfer(account, amount);
        emit Claim(account, nftId, amount);
    }

    /** emitted on claiming NFT rewards */
    event ClaimBatch(address account, uint256[] nftIds, uint256[] amounts);

    /** claim tokens for given account and nft-ids */
    function claimForBatch(address account, uint256[] memory nftIds) public {
        uint256[] memory amounts = claimableForBatch(account, nftIds);
        for (uint256 i = 0; i < nftIds.length; i++) {
            require(amounts[i] > 0, "nothing claimable");
            _claimed[account][nftIds[i]] += amounts[i];
            _claimedTotal[nftIds[i]] += amounts[i];
        }
        for (uint256 i = 0; i < nftIds.length; i++) {
            _moe.transfer(account, amounts[i]);
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
        uint256 age = _ageOf(account, nftId);
        uint256 denomination = _denominationOf(_levelOf(nftId));
        uint256 apr = aprOf(nftId);
        uint256 aprBonus = aprBonusOf(nftId);
        uint256 reward = (apr * age * denomination) / 365_25 days;
        uint256 rewardBonus = (aprBonus * age * denomination) / (1_000 * 365_25 days);
        return reward + rewardBonus;
    }

    /** @return reward total of tokens for given nft-id */
    function totalRewardOf(uint256 nftId) public view returns (uint256) {
        uint256 age = _totalAgeOf(nftId);
        uint256 denomination = _denominationOf(_levelOf(nftId));
        uint256 apr = aprOf(nftId);
        uint256 aprBonus = aprBonusOf(nftId);
        uint256 reward = (apr * age * denomination) / 365_25 days;
        uint256 rewardBonus = (aprBonus * age * denomination) / (1_000 * 365_25 days);
        return reward + rewardBonus;
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

    /** @return apr i.e. annual percentage rate (per nft.level) */
    function aprOf(uint256 nftId) public view returns (uint256) {
        uint256 level = _nftStaked.levelOf(nftId);
        if (level > _alphas[3]) {
            return ((level - _alphas[3]) * _alphas[2]) / _alphas[1] + _alphas[0];
        }
        return _alphas[0];
    }

    /** @return apr parameters */
    function getAlpha() public view returns (uint256[] memory) {
        return _alphas;
    }

    /** set apr parameters */
    function setAlpha(uint256[] memory array) public onlyOwner {
        require(array.length == 4, "invalid array.length");
        _alphas = array;
    }

    /** @return apr-bonus i.e. annual percentage permille rate (per nft.year) */
    function aprBonusOf(uint256 nftId) public view returns (uint256) {
        uint256 nowYear = _nftStaked.year();
        uint256 nftYear = _nftStaked.yearOf(nftId);
        uint256 ageYear = nowYear > nftYear ? nowYear - nftYear : 0;
        if (ageYear > _gammas[3]) {
            return ((ageYear - _gammas[3]) * _gammas[2]) / _gammas[1] + _gammas[0];
        }
        return _gammas[0];
    }

    /** @return apr-bonus parameters */
    function getGamma() public view returns (uint256[] memory) {
        return _gammas;
    }

    /** set apr-bonus parameters */
    function setGamma(uint256[] memory array) public onlyOwner {
        require(array.length == 4, "invalid array.length");
        _gammas = array;
    }

    /** @return age seconds for given account and nft-id */
    function _ageOf(address account, uint256 nftId) internal view returns (uint256) {
        return _nftStaked.ageOf(account, nftId); // nft.balance * nft.average-age
    }

    /** @return age total seconds for given nft-id */
    function _totalAgeOf(uint256 nftId) internal view returns (uint256) {
        return _nftStaked.totalAgeOf(nftId); // nft.supply * nft.average-age
    }

    /** @return denomination value for given nft-level */
    function _denominationOf(uint256 nftLevel) internal view returns (uint256) {
        return _nftStaked.denominationOf(nftLevel); // 1, 1K, 1M, 1G, ...
    }

    /** @return level for given nft-id */
    function _levelOf(uint256 nftId) internal view returns (uint256) {
        return _nftStaked.levelOf(nftId); // 0, 3, 6, 9, ...
    }
}
