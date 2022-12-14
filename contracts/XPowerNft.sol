// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
pragma solidity ^0.8.0;

import "./XPowerNftBase.sol";
import "./XPower.sol";

/**
 * Abstract base class for the THOR, LOKI & ODIN proof-of-work NFTs, where each
 * can only be minted by burning the corresponding amount of tokens.
 */
contract XPowerNft is XPowerNftBase {
    /** burnable proof-of-work tokens */
    XPower[] private _moe;
    /** MOE token address to index map */
    mapping(address => uint) private _moeIndex;

    /** @param nftUri metadata URI */
    /** @param moeLink addresses of contracts for MOE tokens */
    /** @param nftBase addresses of old contracts */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(
        string memory nftUri,
        address[] memory moeLink,
        address[] memory nftBase,
        uint256 deadlineIn
    ) XPowerNftBase("XPower NFTs", "XPOWNFT", nftUri, nftBase, deadlineIn) {
        _moe = new XPower[](moeLink.length);
        for (uint256 i = 0; i < moeLink.length; i++) {
            _moe[i] = XPower(moeLink[i]);
            _moeIndex[moeLink[i]] = i;
        }
    }

    /** mint particular amount of NFTs for given to-address, level and token-index */
    function mint(address to, uint256 level, uint256 amount, uint256 index) public {
        uint256 moeAmount = amount * denominationOf(level);
        require(moeAmount > 0, "non-positive amount");
        _moe[index].burnFrom(to, moeAmount * (10 ** _moe[index].decimals()));
        _mint(to, idBy(year(), level, _moe[index].prefix()), amount, "");
    }

    /** mint particular amounts of NFTs for given to-address, levels and token-index */
    function mintBatch(address to, uint256[] memory levels, uint256[] memory amounts, uint256 index) public {
        uint256 sumAmount = 0;
        for (uint256 i = 0; i < levels.length; i++) {
            uint256 moeAmount = amounts[i] * denominationOf(levels[i]);
            require(moeAmount > 0, "non-positive amount");
            sumAmount += moeAmount;
        }
        _moe[index].burnFrom(to, sumAmount * (10 ** _moe[index].decimals()));
        _mintBatch(to, idsBy(year(), levels, _moe[index].prefix()), amounts, "");
    }

    /** @return index of MOE token address */
    function moeIndexOf(address moe) public view returns (uint256) {
        return _moeIndex[moe];
    }
}
