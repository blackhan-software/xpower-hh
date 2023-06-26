// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

import {XPowerNft} from "./XPowerNft.sol";
import {XPowerPpt} from "./XPowerPpt.sol";
import {MoeTreasury} from "./MoeTreasury.sol";

/**
 * NFT treasury to stake and unstake XPowerNft(s).
 */
contract NftTreasury is ERC1155Holder {
    /** normal NFTs */
    XPowerNft private _nft;
    /** staked NFTs */
    XPowerPpt private _ppt;
    /** MOE treasury */
    MoeTreasury private _mty;

    /** @param nftLink address of contract for normal NFTs */
    /** @param pptLink address of contract for staked NFTs */
    /** @param mtyLink address of contract for MOT treasury */
    constructor(address nftLink, address pptLink, address mtyLink) {
        _nft = XPowerNft(nftLink);
        _ppt = XPowerPpt(pptLink);
        _mty = MoeTreasury(mtyLink);
    }

    /** emitted on staking an NFT */
    event Stake(address from, uint256 nftId, uint256 amount);

    /** stake NFT (for address and amount) */
    function stake(address from, uint256 nftId, uint256 amount) external {
        _nft.safeTransferFrom(from, address(this), nftId, amount, "");
        _ppt.mint(from, nftId, amount);
        emit Stake(from, nftId, amount);
        _refreshRates(nftId);
    }

    /** emitted on staking NFTs */
    event StakeBatch(address from, uint256[] nftIds, uint256[] amounts);

    /** stake NFTs (for address and amounts) */
    function stakeBatch(address from, uint256[] memory nftIds, uint256[] memory amounts) external {
        _nft.safeBatchTransferFrom(from, address(this), nftIds, amounts, "");
        _ppt.mintBatch(from, nftIds, amounts);
        emit StakeBatch(from, nftIds, amounts);
        _refreshRatesBatch(nftIds);
    }

    /** emitted on unstaking an NFT */
    event Unstake(address from, uint256 nftId, uint256 amount);

    /** unstake NFT (for address and amount) */
    function unstake(address from, uint256 nftId, uint256 amount) external {
        _ppt.burn(from, nftId, amount);
        _nft.safeTransferFrom(address(this), from, nftId, amount, "");
        emit Unstake(from, nftId, amount);
        _refreshRates(nftId);
    }

    /** emitted on unstaking NFTs */
    event UnstakeBatch(address from, uint256[] nftIds, uint256[] amounts);

    /** unstake NFTs (for address and amounts) */
    function unstakeBatch(address from, uint256[] memory nftIds, uint256[] memory amounts) external {
        _ppt.burnBatch(from, nftIds, amounts);
        _nft.safeBatchTransferFrom(address(this), from, nftIds, amounts, "");
        emit UnstakeBatch(from, nftIds, amounts);
        _refreshRatesBatch(nftIds);
    }

    /** refresh reward rates of MOE treasury */
    function _refreshRates(uint256 nftId) private {
        uint256 prefix = _nft.prefixOf(nftId);
        _mty.refreshRates(prefix, false);
    }

    /** batch-refresh reward rates of MOE treasury */
    function _refreshRatesBatch(uint256[] memory nftIds) private {
        bool[] memory refresh = new bool[](3);
        for (uint256 i = 0; i < nftIds.length; i++) {
            uint256 p = _nft.prefixOf(nftIds[i]) - 1;
            if (!refresh[p]) refresh[p] = true;
        }
        for (uint256 p = 0; p < refresh.length; p++) {
            if (refresh[p]) _mty.refreshRates(p + 1, false);
        }
    }
}
