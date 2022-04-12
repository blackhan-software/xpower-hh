// SPDX-License-Identifier: GPL-3.0
// solhint-disable no-unused-vars
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

import "./XPowerNft.sol";
import "./XPowerNftStaked.sol";

/**
 * NFT treasury to stake and unstake XPowerNft(s).
 */
contract NftTreasury is ERC1155Holder {
    /** normal proof-of-work NFTs */
    XPowerNft private _nft;
    /** staked proof-of-work NFTs */
    XPowerNftStaked private _nftStaked;

    /** @param nft address of contract for normal NFTs */
    /** @param nftStaked address of contract for staked NFTs */
    constructor(address nft, address nftStaked) {
        _nft = XPowerNft(nft);
        _nftStaked = XPowerNftStaked(nftStaked);
    }

    /** emitted on staking an NFT */
    event Stake(address from, uint256 nftId, uint256 amount);

    /** stake NFT for given address and amount */
    function stake(
        address from,
        uint256 nftId,
        uint256 amount
    ) public {
        require(amount > 0, "non-positive amount");
        address self = (address)(this);
        _nft.safeTransferFrom(from, self, nftId, amount, "");
        _nftStaked.mint(from, nftId, amount);
        emit Stake(from, nftId, amount);
    }

    /** emitted on staking NFTs */
    event StakeBatch(address from, uint256[] nftIds, uint256[] amounts);

    /** stake NFTs for given address and amounts */
    function stakeBatch(
        address from,
        uint256[] memory nftIds,
        uint256[] memory amounts
    ) public {
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "non-positive amount");
        }
        address self = (address)(this);
        _nft.safeBatchTransferFrom(from, self, nftIds, amounts, "");
        _nftStaked.mintBatch(from, nftIds, amounts);
        emit StakeBatch(from, nftIds, amounts);
    }

    /** emitted on unstaking an NFT */
    event Unstake(address from, uint256 nftId, uint256 amount);

    /** unstake NFT for given address and amount */
    function unstake(
        address from,
        uint256 nftId,
        uint256 amount
    ) public {
        require(amount > 0, "non-positive amount");
        address self = (address)(this);
        _nftStaked.burn(from, nftId, amount);
        _nft.safeTransferFrom(self, from, nftId, amount, "");
        emit Unstake(from, nftId, amount);
    }

    /** emitted on unstaking NFTs */
    event UnstakeBatch(address from, uint256[] nftIds, uint256[] amounts);

    /** unstake NFTs for given address and amounts */
    function unstakeBatch(
        address from,
        uint256[] memory nftIds,
        uint256[] memory amounts
    ) public {
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "non-positive amount");
        }
        address self = (address)(this);
        _nftStaked.burnBatch(from, nftIds, amounts);
        _nft.safeBatchTransferFrom(self, from, nftIds, amounts, "");
        emit UnstakeBatch(from, nftIds, amounts);
    }
}
