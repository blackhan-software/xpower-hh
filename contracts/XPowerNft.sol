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
    /** map of indices: moe-address => index */
    mapping(address => uint) private _moeA2Index;
    /** map of indices: moe-prefix => index */
    mapping(uint256 => uint256) private _moeP2Index;

    /** @param nftUri metadata URI */
    /** @param moeLink addresses of MOE tokens */
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
            _moeA2Index[moeLink[i]] = i;
            _moe[i] = XPower(moeLink[i]);
            _moeP2Index[_moe[i].prefix()] = i;
        }
    }

    /** mint NFTs */
    function mint(address to, uint256 level, uint256 amount, uint256 index) external {
        _depositFrom(to, level, amount, index); // MOE transfer to vault
        _mint(to, idBy(year(), level, _moe[index].prefix()), amount, "");
    }

    function _depositFrom(address from, uint256 level, uint256 amount, uint256 index) private {
        XPower moe = _moe[index];
        uint256 moeAmount = amount * denominationOf(level);
        moe.transferFrom(from, address(this), moeAmount * 10 ** moe.decimals());
    }

    /** burn NFTs */
    function burn(address from, uint256 id, uint256 amount) public override {
        super.burn(from, id, amount);
        _redeemTo(from, id, amount);
    }

    function _redeemTo(address to, uint256 id, uint256 amount) private {
        XPower moe = _moe[_moeP2Index[prefixOf(id)]];
        uint256 moeAmount = amount * denominationOf(levelOf(id));
        moe.transfer(to, moeAmount * 10 ** moe.decimals());
    }

    /** burn NFTs during migration */
    function _burnFrom(address from, uint256 id, uint256 amount, uint256[] memory index) internal override {
        super._burnFrom(from, id, amount, index);
        _migrateDeposit(from, id, amount, index);
    }

    function _migrateDeposit(address from, uint256 id, uint256 amount, uint256[] memory index) private {
        XPower moe = _moe[_moeP2Index[prefixOf(id)]];
        uint256 moeAmount = amount * denominationOf(levelOf(id));
        uint256[] memory moeIndex = new uint256[](1);
        moeIndex[0] = index[1]; // drop nft-index
        uint256 oldAmount = moe.balanceOf(from);
        moe.migrateFrom(from, moeAmount * 10 ** moe.decimals(), moeIndex);
        uint256 newAmount = moe.balanceOf(from);
        if (newAmount > oldAmount) {
            uint256 migAmount = newAmount - oldAmount;
            moe.transferFrom(from, address(this), migAmount);
        }
    }

    /** batch-mint NFTs */
    function mintBatch(address to, uint256[] memory levels, uint256[] memory amounts, uint256 index) external {
        require(levels.length > 0, "empty levels");
        require(amounts.length > 0, "empty amounts");
        _depositFromBatch(to, levels, amounts, index); // MOE transfer to vault
        _mintBatch(to, idsBy(year(), levels, _moe[index].prefix()), amounts, "");
    }

    function _depositFromBatch(address from, uint256[] memory levels, uint256[] memory amounts, uint256 index) private {
        uint256 sumAmount = 0;
        for (uint256 i = 0; i < levels.length; i++) {
            sumAmount += amounts[i] * denominationOf(levels[i]);
        }
        XPower moe = _moe[index];
        moe.transferFrom(from, address(this), sumAmount * 10 ** moe.decimals());
    }

    /** batch-burn NFTs */
    function burnBatch(address from, uint256[] memory ids, uint256[] memory amounts) public override {
        super.burnBatch(from, ids, amounts);
        _redeemToBatch(from, ids, amounts);
    }

    function _redeemToBatch(address to, uint256[] memory ids, uint256[] memory amounts) private {
        for (uint256 i = 0; i < ids.length; i++) {
            XPower moe = _moe[_moeP2Index[prefixOf(ids[i])]];
            uint256 moeAmount = amounts[i] * denominationOf(levelOf(ids[i]));
            moe.transfer(to, moeAmount * 10 ** moe.decimals());
        }
    }

    /** upgrade NFTs */
    function upgrade(address from, uint256 anno, uint256 level, uint256 amount, uint256 index) external {
        require(level > 0, "non-positive level");
        require(level > 2, "non-ternary level");
        _burn(from, idBy(anno, level - 3, _moe[index].prefix()), amount * 1000);
        _mint(from, idBy(anno, level, _moe[index].prefix()), amount, "");
    }

    /** upgrade NFTs */
    function upgradeBatch(
        address from,
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
                amountz[i][j] = amounts[i][j] * 1000;
            }
        }
        uint256 prefix = _moe[index].prefix();
        for (uint256 i = 0; i < annos.length; i++) {
            _burnBatch(from, idsBy(annos[i], levelz[i], prefix), amountz[i]);
            _mintBatch(from, idsBy(annos[i], levels[i], prefix), amounts[i], "");
        }
    }

    /** @return index of MOE address */
    function moeIndexOf(address moe) external view returns (uint256) {
        return _moeA2Index[moe];
    }
}
