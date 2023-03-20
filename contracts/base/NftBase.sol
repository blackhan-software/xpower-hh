// SPDX-License-Identifier: GPL-3.0
// solhint-disable no-empty-blocks
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

import {Constants} from "../libs/Constants.sol";
import {Nft} from "../libs/Nft.sol";
import {NftMigratable} from "./NftMigratable.sol";
import {NftRoyalty} from "./NftRoyalty.sol";
import {URIMalleable} from "./URIMalleable.sol";

/**
 * Abstract base NFT class: publicly *not* minteable (nor burnable).
 */
abstract contract NftBase is ERC1155, ERC1155Burnable, ERC1155Supply, URIMalleable, NftRoyalty, NftMigratable, Ownable {
    /** contract name */
    string public name;
    /** contract symbol */
    string public symbol;

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

    /** @param nftBase address of old contract */
    /** @param uri meta-data URI */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(
        string memory nftName,
        string memory nftSymbol,
        string memory nftUri,
        address[] memory nftBase,
        uint256 deadlineIn
    )
        // ERC1155 constructor: meta-data URI
        ERC1155(nftUri)
        // MigratableNft: old contract, rel. deadline [seconds]
        NftMigratable(nftBase, deadlineIn)
    {
        name = nftName;
        symbol = nftSymbol;
    }

    /** @return nft-id composed of (year, level, prefix) */
    function idBy(uint256 anno, uint256 level, uint256 prefix) public pure returns (uint256) {
        return Nft.idBy(anno, level, prefix);
    }

    /** @return nft-ids composed of [(year, level, prefix) for level in levels] */
    function idsBy(uint256 anno, uint256[] memory levels, uint256 prefix) public pure returns (uint256[] memory) {
        return Nft.idsBy(anno, levels, prefix);
    }

    /** @return denomination of level (1, 1'000, 1'000'000, ...) */
    function denominationOf(uint256 level) public pure returns (uint256) {
        return Nft.denominationOf(level);
    }

    /** @return level of nft-id (0, 3, 6, ...) */
    function levelOf(uint256 nftId) public pure returns (uint256) {
        return Nft.levelOf(nftId);
    }

    /** @return prefix of nft-id (1, 2, 3, ...) */
    function prefixOf(uint256 nftId) public pure returns (uint256) {
        return Nft.prefixOf(nftId);
    }

    /** @return year of nft-id (2021, 2022, ...) */
    function yearOf(uint256 nftId) public pure returns (uint256) {
        return Nft.yearOf(nftId);
    }

    /** @return current number of years since anno domini */
    function year() public view returns (uint256) {
        return Nft.year();
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
        ERC1155Supply._beforeTokenTransfer(operator, from, to, nftIds, amounts, data);
    }

    /** @return true if this contract implements the interface defined by interfaceId */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155, URIMalleable, NftRoyalty, NftMigratable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
