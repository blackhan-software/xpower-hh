// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
pragma solidity ^0.8.0;

import {ERC20, IERC20, IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Supervised, MoeMigratableSupervised, SovMigratableSupervised} from "./Supervised.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * Allows migration of tokens from an old contract upto a certain deadline.
 * Further, it is possible to close down the migration window earlier than
 * the specified deadline.
 */
abstract contract Migratable is ERC20, ERC20Burnable, Supervised {
    /** burnable ERC20 tokens */
    ERC20Burnable[] private _base;
    /** base address to index map */
    mapping(address => uint) private _index;
    /** timestamp of migration deadline */
    uint256 private _deadlineBy;
    /** flag to seal migrations */
    bool[] private _sealed;
    /** number of migrated tokens */
    uint256 private _migrated;

    /** @param base addresses of old contracts */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address[] memory base, uint256 deadlineIn) {
        _deadlineBy = block.timestamp + deadlineIn;
        _base = new ERC20Burnable[](base.length);
        _sealed = new bool[](base.length);
        for (uint256 i = 0; i < base.length; i++) {
            _base[i] = ERC20Burnable(base[i]);
            _index[base[i]] = i;
        }
    }

    /** @return index of base address */
    function oldIndexOf(address base) public view returns (uint256) {
        return _index[base];
    }

    /** migrate old amount of ERC20 tokens */
    function migrate(uint256 oldAmount, uint256[] memory index) public returns (uint256) {
        return migrateFrom(msg.sender, oldAmount, index);
    }

    /** migrate old amount of ERC20 tokens (for account) */
    function migrateFrom(address account, uint256 oldAmount, uint256[] memory index) public virtual returns (uint256) {
        uint256 minAmount = Math.min(oldAmount, _base[index[0]].balanceOf(account));
        uint256 newAmount = _premigrate(account, minAmount, index[0]);
        _mint(account, newAmount);
        return newAmount;
    }

    /** migrate old amount of ERC20 tokens (w/o minting new ones) */
    function _premigrate(address account, uint256 oldAmount, uint256 index) internal returns (uint256) {
        require(!_sealed[index], "migration sealed");
        uint256 timestamp = block.timestamp;
        require(_deadlineBy >= timestamp, "deadline passed");
        _base[index].burnFrom(account, oldAmount);
        assert(oldAmount > 0 || oldAmount == 0);
        uint256 newAmount = newUnits(oldAmount, index);
        _migrated += newAmount;
        return newAmount;
    }

    /** @return forward converted new amount w.r.t. decimals */
    function newUnits(uint256 oldAmount, uint256 index) public view returns (uint256) {
        if (decimals() >= _base[index].decimals()) {
            return oldAmount * (10 ** (decimals() - _base[index].decimals()));
        } else {
            return oldAmount / (10 ** (_base[index].decimals() - decimals()));
        }
    }

    /** @return backward converted old amount w.r.t. decimals */
    function oldUnits(uint256 newAmount, uint256 index) public view returns (uint256) {
        if (decimals() >= _base[index].decimals()) {
            return newAmount / (10 ** (decimals() - _base[index].decimals()));
        } else {
            return newAmount * (10 ** (_base[index].decimals() - decimals()));
        }
    }

    /** @return number of migrated tokens */
    function migrated() public view returns (uint256) {
        return _migrated;
    }

    /** seal migration (manually) */
    function _seal(uint256 index) internal {
        _sealed[index] = true;
    }

    /** seal-all migration (manually) */
    function _sealAll() internal {
        for (uint256 i = 0; i < _sealed.length; i++) {
            _seal(i);
        }
    }

    /** @return seal flags (for all bases) */
    function seals() public view returns (bool[] memory) {
        return _sealed;
    }

    /** @return true if this contract implements the interface defined by interfaceId */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IERC20).interfaceId ||
            interfaceId == type(IERC20Metadata).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}

/**
 * Allows migration of MOE tokens from an old contract upto a certain deadline.
 */
abstract contract MoeMigratable is Migratable, MoeMigratableSupervised {
    /** migrate old amount of MOE tokens (for account) */
    ///
    /// @dev should always be invoked *before* SovMigratable.migrate[From]
    ///
    function migrateFrom(address account, uint256 oldAmount, uint256[] memory index) public override returns (uint256) {
        return super.migrateFrom(account, oldAmount, index);
    }

    /** seal migration (manually) */
    function seal(uint256 index) public onlyRole(MOE_SEAL_ROLE) {
        _seal(index);
    }

    /** seal-all migration (manually) */
    function sealAll() public onlyRole(MOE_SEAL_ROLE) {
        _sealAll();
    }

    /** @return true if this contract implements the interface defined by interfaceId */
    function supportsInterface(bytes4 interfaceId) public view virtual override(Migratable, Supervised) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

/**
 * Allows migration of SOV tokens from an old contract upto a certain deadline.
 */
abstract contract SovMigratable is Migratable, SovMigratableSupervised {
    /** migratable MOE tokens */
    MoeMigratable private _moe;

    /** @param moe address of MOE tokens */
    /** @param base addresses of old contracts */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address moe, address[] memory base, uint256 deadlineIn) Migratable(base, deadlineIn) {
        _moe = MoeMigratable(moe);
    }

    /** migrate old amount of SOV tokens (for account) */
    ///
    /// @dev assumes old (XPower:APower) == new (XPower:APower) w.r.t. decimals
    ///
    function migrateFrom(address account, uint256 oldAmount, uint256[] memory index) public override returns (uint256) {
        uint256[] memory moeIndex = _shift(index);
        assert(moeIndex.length + 1 == index.length);
        uint256 newAmountSov = newUnits(oldAmount, index[0]);
        uint256 migAmountSov = _premigrate(account, oldAmount, index[0]);
        assert(migAmountSov == newAmountSov);
        uint256 newAmountMoe = moeUnits(newAmountSov);
        uint256 oldAmountMoe = _moe.oldUnits(newAmountMoe, moeIndex[0]);
        uint256 migAmountMoe = _moe.migrateFrom(account, oldAmountMoe, moeIndex);
        assert(_moe.transferFrom(account, (address)(this), migAmountMoe));
        _mint(account, newAmountSov);
        return newAmountSov;
    }

    /** @return cross-converted MOE amount w.r.t. decimals */
    function moeUnits(uint256 sovAmount) public view returns (uint256) {
        if (decimals() >= _moe.decimals()) {
            return sovAmount / (10 ** (decimals() - _moe.decimals()));
        } else {
            return sovAmount * (10 ** (_moe.decimals() - decimals()));
        }
    }

    /** @return cross-converted SOV amount w.r.t. decimals */
    function sovUnits(uint256 moeAmount) public view returns (uint256) {
        if (decimals() >= _moe.decimals()) {
            return moeAmount * (10 ** (decimals() - _moe.decimals()));
        } else {
            return moeAmount / (10 ** (_moe.decimals() - decimals()));
        }
    }

    /** seal migration (manually) */
    function seal(uint256 index) public onlyRole(SOV_SEAL_ROLE) {
        _seal(index);
    }

    /** seal-all migration (manually) */
    function sealAll() public onlyRole(SOV_SEAL_ROLE) {
        _sealAll();
    }

    /** @return true if this contract implements the interface defined by interfaceId */
    function supportsInterface(bytes4 interfaceId) public view virtual override(Migratable, Supervised) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /** @return shifted array (by a single position to the left) */
    function _shift(uint256[] memory source) private pure returns (uint256[] memory) {
        uint256[] memory target = new uint256[](source.length - 1);
        for (uint256 i = 0; i < target.length; i++) {
            target[i] = source[i + 1];
        }
        return target;
    }
}
