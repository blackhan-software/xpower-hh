// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./XPowerNftBase.sol";

/**
 * Abstract base class for the PARA, AQCH & QRSH proof-of-work NFTs, where each
 * can only be minted by burning the corresponding amount of tokens.
 */
contract XPowerNft is XPowerNftBase {
    /** (Burnable) proof-of-work tokens */
    ERC20Burnable private _moe;

    /** @param uri meta-data URI */
    /** @param base address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    /** @param moe address of contract for proof-of-work tokens */
    constructor(
        string memory uri,
        address base,
        uint256 deadlineIn,
        address moe
    ) XPowerNftBase(uri, base, deadlineIn) {
        _moe = ERC20Burnable(moe);
    }

    /** mint particular amount of NFTs for given address and level */
    function mint(
        address to,
        uint256 level,
        uint256 amount
    ) public {
        uint256 moe = amount * denominationOf(level);
        require(moe > 0, "non-positive amount");
        _moe.burnFrom(to, moe);
        _mint(to, idBy(year(), level), amount, "");
    }

    /** mint particular amounts of NFTs for given address and levels */
    function mintBatch(
        address to,
        uint256[] memory levels,
        uint256[] memory amounts
    ) public {
        uint256 moe = 0;
        for (uint256 i = 0; i < levels.length; i++) {
            uint256 delta = amounts[i] * denominationOf(levels[i]);
            require(delta > 0, "non-positive amount");
            moe += delta;
        }
        _moe.burnFrom(to, moe);
        _mintBatch(to, idsBy(year(), levels), amounts, "");
    }
}

/**
 * NFT class for PARA tokens: Only the latter are allowed to get burned, to
 * mint PARA NFTs.
 */
contract XPowerParaNft is XPowerNft {
    constructor(
        string memory uri,
        address base,
        uint256 deadlineIn,
        address moe
    ) XPowerNft(uri, base, deadlineIn, moe) {}
}

/**
 * NFT class for AQCH tokens: Only the latter are allowed to get burned, to
 * mint AQCH NFTs.
 */
contract XPowerAqchNft is XPowerNft {
    constructor(
        string memory uri,
        address base,
        uint256 deadlineIn,
        address moe
    ) XPowerNft(uri, base, deadlineIn, moe) {}
}

/**
 * NFT class for QRSH tokens: Only the latter are allowed to get burned, to
 * mint QRSH NFTs.
 */
contract XPowerQrshNft is XPowerNft {
    constructor(
        string memory uri,
        address base,
        uint256 deadlineIn,
        address moe
    ) XPowerNft(uri, base, deadlineIn, moe) {}
}
