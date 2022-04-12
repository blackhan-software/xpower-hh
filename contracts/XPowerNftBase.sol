// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

import "./URIMalleable.sol";
import "./MigratableNft.sol";

/**
 * Abstract base NFT class: publicly *not* minteable (nor burneable).
 */
abstract contract XPowerNftBase is ERC1155, ERC1155Burnable, ERC1155Supply, URIMalleable, MigratableNft {
    /** NFT levels: UNIT, ..., YOTTA *or* higher! */
    uint256 public constant UNIT = 0;
    uint256 public constant KILO = 3;
    uint256 public constant MEGA = 6;
    uint256 public constant GIGA = 9;
    uint256 public constant TERA = 12;
    uint256 public constant PETA = 15;
    uint256 public constant EXA = 18;
    uint256 public constant ZETTA = 21;
    uint256 public constant YOTTA = 24;

    /** @param uri meta-data URI */
    /** @param base address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(
        string memory uri,
        address base,
        uint256 deadlineIn
    )
        // ERC1155 constructor: meta-data URI
        ERC1155(uri)
        // MigratableNft: old contract, rel. deadline [seconds]
        MigratableNft(base, deadlineIn)
    {}

    /** @return nft-id composed of (year, level) */
    function idBy(uint256 anno, uint256 level) public pure returns (uint256) {
        require(level % 3 == 0, "non-ternary level");
        require(level < 100, "invalid level");
        require(anno > 1970, "invalid year");
        return anno * 100 + level;
    }

    /** @return nft-ids composed of [(year, level) for level in levels] */
    function idsBy(uint256 anno, uint256[] memory levels) public pure returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](levels.length);
        for (uint256 i = 0; i < levels.length; i++) {
            ids[i] = idBy(anno, levels[i]);
        }
        return ids;
    }

    /** @return denomination of level (1, 1'000, 1'000'000, ...) */
    function denominationOf(uint256 level) public pure returns (uint256) {
        require(level % 3 == 0, "non-ternary level");
        require(level < 100, "invalid level");
        return 10**level;
    }

    /** @return level of nft-id (0, 3, 6, ...) */
    function levelOf(uint256 nftId) public pure returns (uint256) {
        uint256 level = nftId % 100;
        require(level % 3 == 0, "non-ternary level");
        require(level < 100, "invalid level");
        return level;
    }

    /** @return year of nft-id (2021, 2022, ...) */
    function yearOf(uint256 nftId) public pure returns (uint256) {
        uint256 anno = nftId / 100;
        require(anno > 1970, "invalid year");
        return anno;
    }

    /** @return current number of years since anno domini */
    function year() public view returns (uint256) {
        uint256 anno = 1970 + (100 * block.timestamp) / (365_25 days);
        require(anno > 1970, "invalid year");
        return anno;
    }

    /** called before any token transfer; includes (batched) minting and burning */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory nftIds,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, nftIds, amounts, data);
    }
}
