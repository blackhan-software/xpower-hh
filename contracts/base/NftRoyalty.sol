// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
pragma solidity ^0.8.0;

import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";

import {Constants} from "../libs/Constants.sol";
import {Integrator} from "../libs/Integrator.sol";
import {Nft} from "../libs/Nft.sol";
import {Polynomials, Polynomial} from "../libs/Polynomials.sol";
import {Rpp} from "../libs/Rpp.sol";
import {Supervised, NftRoyaltySupervised} from "./Supervised.sol";

/**
 * Allows changing of the NFT's default royalty *and* beneficiary (by
 * the NFT_ROYALTY_ROLE and NFT_ROYAL_ROLE) while the default royalty
 * fraction is set to a small value of 0.1% (per nft.level).
 */
abstract contract NftRoyalty is IERC2981, NftRoyaltySupervised {
    using Integrator for Integrator.Item[];
    using Polynomials for Polynomial;

    /** @return royalty beneficiary and amount (for nft-id and sale price) */
    function royaltyInfo(uint256 nftId, uint256 price) public view override returns (address, uint256) {
        uint256 amount = (royaltyOf(nftId) * price) / (ROYALTY_MUL * 1_000);
        address beneficiary = getRoyal(Nft.prefixOf(nftId));
        return (beneficiary, amount);
    }

    /** integrator for royalties: nft-prefix => [(stamp, value)] */
    mapping(uint256 => Integrator.Item[]) public royalties;
    /** parametrization of royalty: nft-prefix => coefficients */
    mapping(uint256 => uint256[]) private _royalty;
    /** look-up map of royals: nft-prefix => address */
    mapping(uint256 => address) private _royals;

    /** @return duration weighted mean of royalties (per nft.level) */
    function royaltyOf(uint256 nftId) public view returns (uint256) {
        uint256 nftPrefix = Nft.prefixOf(nftId);
        if (royalties[nftPrefix].length == 0) {
            return royaltyTargetOf(nftId);
        }
        uint256 stamp = block.timestamp;
        uint256 value = royaltyTargetOf(Nft.idBy(2021, 3, nftPrefix));
        uint256 point = royalties[nftPrefix].meanOf(stamp, value);
        return (point * Nft.levelOf(nftId)) / 3;
    }

    /** @return target for annualized percentage rate (per nft.level) */
    function royaltyTargetOf(uint256 nftId) public view returns (uint256) {
        return royaltyTargetOf(nftId, getRoyalty(Nft.prefixOf(nftId)));
    }

    /** @return target for annualized percentage rate (per nft.level & parametrization) */
    function royaltyTargetOf(uint256 nftId, uint256[] memory array) private pure returns (uint256) {
        return Polynomial(array).eval4Clamped(Nft.levelOf(nftId));
    }

    /** royalty fraction: 10.000[‱] (per nft.level) */
    uint256 private constant ROYALTY_MUL = 10_000;
    uint256 private constant ROYALTY_DIV = 3;

    /** @return royalty parameters (for nft-prefix) */
    function getRoyalty(uint256 nftPrefix) public view returns (uint256[] memory) {
        if (_royalty[nftPrefix].length > 0) {
            return _royalty[nftPrefix];
        }
        uint256[] memory array = new uint256[](4);
        array[3] = ROYALTY_MUL;
        array[2] = ROYALTY_DIV;
        return array;
    }

    /** set royalty parameters (for nft-prefix) */
    function setRoyalty(uint256 nftPrefix, uint256[] memory array) public onlyRole(NFT_ROYALTY_ROLE) {
        Rpp.checkArray(array);
        // fixed nft-id as anchor
        uint256 nftId = Nft.idBy(2021, 3, nftPrefix);
        // check royalty reparametrization of value
        uint256 nextValue = royaltyTargetOf(nftId, array);
        uint256 currValue = royaltyTargetOf(nftId);
        Rpp.checkValue(nextValue, currValue);
        // check royalty reparametrization of stamp
        uint256 lastStamp = royalties[nftPrefix].lastOf().stamp;
        uint256 currStamp = block.timestamp;
        Rpp.checkStamp(currStamp, lastStamp);
        // append (stamp, royalty-of[nft-id]) to integrator
        royalties[nftPrefix].append(currStamp, currValue);
        // all requirements satisfied: use array
        _royalty[nftPrefix] = array;
    }

    /** batch-set royalty parameters (for nft-prefixes) */
    function setRoyaltyBatch(uint256[] memory nftPrefixes, uint256[] memory array) public onlyRole(NFT_ROYALTY_ROLE) {
        for (uint256 p = 0; p < nftPrefixes.length; p++) {
            setRoyalty(nftPrefixes[p], array);
        }
    }

    /** @return default royalty beneficiary (for nft-prefix) */
    function getRoyal(uint256 nftPrefix) public view returns (address) {
        return _royals[nftPrefix];
    }

    /** set default royalty beneficiary (for nft-prefix) */
    function setRoyal(uint256 nftPrefix, address beneficiary) public onlyRole(NFT_ROYAL_ROLE) {
        _royals[nftPrefix] = beneficiary;
    }

    /** batch-set royalty beneficiaries (for nft-prefixes) */
    function setRoyalBatch(uint256[] memory nftPrefixes, address beneficiary) public onlyRole(NFT_ROYAL_ROLE) {
        for (uint256 p = 0; p < nftPrefixes.length; p++) {
            setRoyal(nftPrefixes[p], beneficiary);
        }
    }

    /** @return true if this contract implements the interface defined by interfaceId */
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, Supervised) returns (bool) {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
}