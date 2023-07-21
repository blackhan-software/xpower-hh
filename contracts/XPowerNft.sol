// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import {NftBase} from "./base/NftBase.sol";
import {XPower} from "./XPower.sol";

/**
 * Class for the XPOW NFTs, where each can only be minted by depositing the
 * corresponding amount of tokens.
 */
contract XPowerNft is NftBase {
    /** burnable proof-of-work tokens */
    XPower private _moe;

    /** @param moeLink address of MOE tokens */
    /** @param nftUri metadata URI */
    /** @param nftBase addresses of old contracts */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(
        address moeLink,
        string memory nftUri,
        address[] memory nftBase,
        uint256 deadlineIn
    ) NftBase("XPower NFTs", "XPOWNFT", nftUri, nftBase, deadlineIn) {
        _moe = XPower(moeLink);
    }

    /** mint NFTs */
    function mint(address to, uint256 level, uint256 amount) external {
        _depositFrom(to, level, amount); // MOE transfer to vault
        _mint(to, idBy(year(), level), amount, "");
    }

    function _depositFrom(address from, uint256 level, uint256 amount) private {
        uint256 moeAmount = amount * denominationOf(level);
        _moe.transferFrom(from, address(this), moeAmount * 10 ** _moe.decimals());
    }

    /** burn NFTs */
    function burn(address from, uint256 id, uint256 amount) public override {
        super.burn(from, id, amount);
        _redeemTo(from, id, amount);
    }

    function _redeemTo(address to, uint256 id, uint256 amount) private {
        require(_redeemable(id), "irredeemable issue");
        uint256 moeAmount = amount * denominationOf(levelOf(id));
        _moe.transfer(to, moeAmount * 10 ** _moe.decimals());
    }

    function _redeemable(uint256 id) private view returns (bool) {
        return yearOf(id) + levelOf(id) / 3 <= year() || migratable();
    }

    /** burn NFTs during migration */
    function _burnFrom(address from, uint256 id, uint256 amount, uint256[] memory index) internal override {
        super._burnFrom(from, id, amount, index);
        _migrateDeposit(from, id, amount, index);
    }

    function _migrateDeposit(address from, uint256 id, uint256 amount, uint256[] memory index) private {
        uint256 moeAmount = amount * denominationOf(levelOf(id));
        uint256[] memory moeIndex = new uint256[](1);
        moeIndex[0] = index[1]; // drop nft-index
        uint256 oldAmount = _moe.balanceOf(from);
        _moe.migrateFrom(from, moeAmount * 10 ** _moe.decimals(), moeIndex);
        uint256 newAmount = _moe.balanceOf(from);
        if (newAmount > oldAmount) {
            uint256 migAmount = newAmount - oldAmount;
            _moe.transferFrom(from, address(this), migAmount);
        }
    }

    /** batch-mint NFTs */
    function mintBatch(address to, uint256[] memory levels, uint256[] memory amounts) external {
        _depositFromBatch(to, levels, amounts); // MOE transfer to vault
        _mintBatch(to, idsBy(year(), levels), amounts, "");
    }

    function _depositFromBatch(address from, uint256[] memory levels, uint256[] memory amounts) private {
        uint256 sumAmount = 0;
        for (uint256 i = 0; i < levels.length; i++) {
            sumAmount += amounts[i] * denominationOf(levels[i]);
        }
        _moe.transferFrom(from, address(this), sumAmount * 10 ** _moe.decimals());
    }

    /** batch-burn NFTs */
    function burnBatch(address from, uint256[] memory ids, uint256[] memory amounts) public override {
        super.burnBatch(from, ids, amounts);
        _redeemToBatch(from, ids, amounts);
    }

    function _redeemToBatch(address to, uint256[] memory ids, uint256[] memory amounts) private {
        for (uint256 i = 0; i < ids.length; i++) {
            require(_redeemable(ids[i]), "irredeemable issue");
            uint256 moeAmount = amounts[i] * denominationOf(levelOf(ids[i]));
            _moe.transfer(to, moeAmount * 10 ** _moe.decimals());
        }
    }

    /** upgrade NFTs */
    function upgrade(address from, uint256 anno, uint256 level, uint256 amount) external {
        require(level > 2, "non-ternary level");
        _burn(from, idBy(anno, level - 3), amount * 1000);
        _mint(from, idBy(anno, level), amount, "");
    }

    /** upgrade NFTs */
    function upgradeBatch(
        address from,
        uint256[] memory annos,
        uint256[][] memory levels,
        uint256[][] memory amounts
    ) external {
        uint256[][] memory levelz = new uint256[][](annos.length);
        for (uint256 i = 0; i < annos.length; i++) {
            levelz[i] = new uint256[](levels[i].length);
            for (uint256 j = 0; j < levels[i].length; j++) {
                require(levels[i][j] > 2, "non-ternary level");
                levelz[i][j] = levels[i][j] - 3;
            }
        }
        uint256[][] memory amountz = new uint256[][](annos.length);
        for (uint256 i = 0; i < annos.length; i++) {
            amountz[i] = new uint256[](amounts[i].length);
            for (uint256 j = 0; j < amounts[i].length; j++) {
                amountz[i][j] = amounts[i][j] * 1000;
            }
        }
        for (uint256 i = 0; i < annos.length; i++) {
            _burnBatch(from, idsBy(annos[i], levelz[i]), amountz[i]);
            _mintBatch(from, idsBy(annos[i], levels[i]), amounts[i], "");
        }
    }
}
