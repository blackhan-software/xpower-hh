// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./XPowerNftBase.sol";

/**
 * Abstract base class for the THOR, LOKI & ODIN proof-of-work NFTs, where each
 * can only be minted by burning the corresponding amount of tokens.
 */
contract XPowerNft is XPowerNftBase {
    /** (Burnable) proof-of-work tokens */
    ERC20Burnable private _moe;

    /** @param nftName NFT name */
    /** @param nftSymbol NFT symbol */
    /** @param nftUri metadata URI */
    /** @param nftBase address of old contract */
    /** @param moeLink address of contract for MOE tokens */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(
        string memory nftName,
        string memory nftSymbol,
        string memory nftUri,
        address moeLink,
        address[] memory nftBase,
        uint256 deadlineIn
    ) XPowerNftBase(nftName, nftSymbol, nftUri, nftBase, deadlineIn) {
        _moe = ERC20Burnable(moeLink);
    }

    /** mint particular amount of NFTs for given address and level */
    function mint(address to, uint256 level, uint256 amount) public {
        uint256 moe = amount * denominationOf(level);
        require(moe > 0, "non-positive amount");
        _moe.burnFrom(to, moe * (10 ** _moe.decimals()));
        _mint(to, idBy(year(), level), amount, "");
    }

    /** mint particular amounts of NFTs for given address and levels */
    function mintBatch(address to, uint256[] memory levels, uint256[] memory amounts) public {
        uint256 moe = 0;
        for (uint256 i = 0; i < levels.length; i++) {
            uint256 delta = amounts[i] * denominationOf(levels[i]);
            require(delta > 0, "non-positive amount");
            moe += delta;
        }
        _moe.burnFrom(to, moe * (10 ** _moe.decimals()));
        _mintBatch(to, idsBy(year(), levels), amounts, "");
    }
}

/**
 * NFT class for THOR tokens: Only the latter are allowed to get burned, to
 * mint THOR NFTs.
 */
contract XPowerThorNft is XPowerNft {
    constructor(
        string memory nftUri,
        address moeLink,
        address[] memory nftBase,
        uint256 deadlineIn
    ) XPowerNft("XPower Thor", "THORNFT", nftUri, moeLink, nftBase, deadlineIn) {}
}

/**
 * NFT class for LOKI tokens: Only the latter are allowed to get burned, to
 * mint LOKI NFTs.
 */
contract XPowerLokiNft is XPowerNft {
    constructor(
        string memory nftUri,
        address moeLink,
        address[] memory nftBase,
        uint256 deadlineIn
    ) XPowerNft("XPower Loki", "LOKINFT", nftUri, moeLink, nftBase, deadlineIn) {}
}

/**
 * NFT class for ODIN tokens: Only the latter are allowed to get burned, to
 * mint ODIN NFTs.
 */
contract XPowerOdinNft is XPowerNft {
    constructor(
        string memory nftUri,
        address moeLink,
        address[] memory nftBase,
        uint256 deadlineIn
    ) XPowerNft("XPower Odin", "ODINNFT", nftUri, moeLink, nftBase, deadlineIn) {}
}
