// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

import {XPowerNft} from "./XPowerNft.sol";
import {XPowerPpt} from "./XPowerPpt.sol";

/**
 * NFT treasury to stake and unstake XPowerNft(s).
 */
contract NftTreasury is ERC1155Holder {
    /** normal proof-of-work NFTs */
    XPowerNft private _nft;
    /** staked proof-of-work NFTs */
    XPowerPpt private _ppt;

    /** @param nftLink address of contract for normal NFTs */
    /** @param pptLink address of contract for staked NFTs */
    constructor(address nftLink, address pptLink) {
        _nft = XPowerNft(nftLink);
        _ppt = XPowerPpt(pptLink);
    }

    /** emitted on staking an NFT */
    event Stake(address from, uint256 nftId, uint256 amount);

    /** stake NFT (for address and amount) */
    function stake(address from, uint256 nftId, uint256 amount) public {
        _nft.safeTransferFrom(from, address(this), nftId, amount, "");
        _ppt.mint(from, nftId, amount);
        emit Stake(from, nftId, amount);
    }

    /** emitted on staking NFTs */
    event StakeBatch(address from, uint256[] nftIds, uint256[] amounts);

    /** stake NFTs (for address and amounts) */
    function stakeBatch(address from, uint256[] memory nftIds, uint256[] memory amounts) public {
        _nft.safeBatchTransferFrom(from, address(this), nftIds, amounts, "");
        _ppt.mintBatch(from, nftIds, amounts);
        emit StakeBatch(from, nftIds, amounts);
    }

    /** emitted on unstaking an NFT */
    event Unstake(address from, uint256 nftId, uint256 amount);

    /** unstake NFT (for address and amount) */
    function unstake(address from, uint256 nftId, uint256 amount) public {
        _ppt.burn(from, nftId, amount);
        _nft.safeTransferFrom(address(this), from, nftId, amount, "");
        emit Unstake(from, nftId, amount);
    }

    /** emitted on unstaking NFTs */
    event UnstakeBatch(address from, uint256[] nftIds, uint256[] amounts);

    /** unstake NFTs (for address and amounts) */
    function unstakeBatch(address from, uint256[] memory nftIds, uint256[] memory amounts) public {
        _ppt.burnBatch(from, nftIds, amounts);
        _nft.safeBatchTransferFrom(address(this), from, nftIds, amounts, "");
        emit UnstakeBatch(from, nftIds, amounts);
    }
}
