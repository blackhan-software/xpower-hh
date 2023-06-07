// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import {NftBase} from "./base/NftBase.sol";
import {XPower} from "./XPower.sol";

/**
 * Abstract base class for the THOR, LOKI & ODIN proof-of-work NFTs, where each
 * can only be minted by burning the corresponding amount of tokens.
 */
contract XPowerNft is NftBase {
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
    ) NftBase("XPower NFTs", "XPOWNFT", nftUri, nftBase, deadlineIn) {
        _moe = new XPower[](moeLink.length);
        for (uint256 i = 0; i < moeLink.length; i++) {
            _moe[i] = XPower(moeLink[i]);
            _moeIndex[moeLink[i]] = i;
        }
    }

    /** mint NFTs (for to, level, amount and token-index) */
    function mint(address to, uint256 level, uint256 amount, uint256 index) external {
        uint256 moeAmount = amount * denominationOf(level);
        require(moeAmount > 0, "non-positive amount");
        _moe[index].burnFrom(to, moeAmount * (10 ** _moe[index].decimals()));
        _mint(to, idBy(year(), level, _moe[index].prefix()), amount, "");
    }

    /** mint NFTs (for to, levels, amounts and token-index) */
    function mintBatch(address to, uint256[] memory levels, uint256[] memory amounts, uint256 index) external {
        require(levels.length > 0, "empty levels");
        require(amounts.length > 0, "empty amounts");
        uint256 sumAmount = 0;
        for (uint256 i = 0; i < levels.length; i++) {
            uint256 moeAmount = amounts[i] * denominationOf(levels[i]);
            require(moeAmount > 0, "non-positive amount");
            sumAmount += moeAmount;
        }
        _moe[index].burnFrom(to, sumAmount * (10 ** _moe[index].decimals()));
        _mintBatch(to, idsBy(year(), levels, _moe[index].prefix()), amounts, "");
    }

    /** upgrade NFTs (for to, anno, level, amount and token-index) */
    function upgrade(address to, uint256 anno, uint256 level, uint256 amount, uint256 index) external {
        require(level > 0, "non-positive level");
        require(level > 2, "non-ternary level");
        require(amount > 0, "non-positive amount");
        _burn(to, idBy(anno, level - 3, _moe[index].prefix()), amount * 1000);
        _mint(to, idBy(anno, level, _moe[index].prefix()), amount, "");
    }

    /** upgrade NFTs (for to, annos, levels, amounts and token-index) */
    function upgradeBatch(
        address to,
        uint256[] memory annos,
        uint256[][] memory levels,
        uint256[][] memory amounts,
        uint256 index
    ) external {
        uint256[][] memory levelz = new uint256[][](annos.length);
        for (uint256 i = 0; i < annos.length; i++) {
            require(levels[i].length > 0, "empty levels");
            levelz[i] = new uint256[](levels[i].length);
            for (uint256 j = 0; j < levels[i].length; j++) {
                require(levels[i][j] > 0, "non-positive level");
                require(levels[i][j] > 2, "non-ternary level");
                levelz[i][j] = levels[i][j] - 3;
            }
        }
        uint256[][] memory amountz = new uint256[][](annos.length);
        for (uint256 i = 0; i < annos.length; i++) {
            require(amounts[i].length > 0, "empty amounts");
            amountz[i] = new uint256[](amounts[i].length);
            for (uint256 j = 0; j < amounts[i].length; j++) {
                require(amounts[i][j] > 0, "non-positive amount");
                amountz[i][j] = amounts[i][j] * 1000;
            }
        }
        uint256 prefix = _moe[index].prefix();
        for (uint256 i = 0; i < annos.length; i++) {
            _burnBatch(to, idsBy(annos[i], levelz[i], prefix), amountz[i]);
            _mintBatch(to, idsBy(annos[i], levels[i], prefix), amounts[i], "");
        }
    }

    /** @return index of MOE token address */
    function moeIndexOf(address moe) external view returns (uint256) {
        return _moeIndex[moe];
    }
}
