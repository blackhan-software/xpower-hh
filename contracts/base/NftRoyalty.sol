// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
pragma solidity ^0.8.0;

import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";

import {Nft} from "../libs/Nft.sol";
import {Supervised, NftRoyaltySupervised} from "./Supervised.sol";

/**
 * Allows changing of the NFT's beneficiary (by the NFT_ROYAL_ROLE) while
 * the default royalty fraction is set to a flat value of 0.5%.
 */
abstract contract NftRoyalty is IERC2981, NftRoyaltySupervised {
    /** look-up map of royals: nft-prefix => address */
    mapping(uint256 => address) private _royals;

    constructor() {
        _royals[0] = msg.sender; // fallback beneficiary
    }

    /** @return royalty beneficiary and amount (for nft-id & price) */
    function royaltyInfo(uint256 nftId, uint256 price) public view override returns (address, uint256) {
        address beneficiary = getRoyal(Nft.prefixOf(nftId));
        return (beneficiary, price / 200);
    }

    /** @return default royalty beneficiary (for nft-prefix) */
    function getRoyal(uint256 nftPrefix) public view returns (address) {
        if (_royals[nftPrefix] != address(0)) {
            return _royals[nftPrefix];
        }
        return _royals[0];
    }

    /** set default royalty beneficiary (for nft-prefix & beneficiary) */
    function setRoyal(uint256 nftPrefix, address beneficiary) public onlyRole(NFT_ROYAL_ROLE) {
        _royals[nftPrefix] = beneficiary;
    }

    /** batch-set royalty beneficiaries (for nft-prefixes) */
    function setRoyalBatch(uint256[] memory nftPrefixes, address beneficiary) public onlyRole(NFT_ROYAL_ROLE) {
        for (uint256 p = 0; p < nftPrefixes.length; p++) {
            setRoyal(nftPrefixes[p], beneficiary);
        }
    }

    /** @return true if this contract implements the interface defined by interface-id */
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, Supervised) returns (bool) {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
}
