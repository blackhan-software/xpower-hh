// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./Supervised.sol";

/**
 * Allows migration of tokens from an old contract upto a certain deadline.
 * Further, it is possible to close down the migration window earlier than
 * the specified deadline.
 */
abstract contract Migratable is ERC20, ERC20Burnable, Supervised {
    /** burnable ERC20 tokens */
    ERC20Burnable private _erc20;
    /** timestamp of migration deadline */
    uint256 private _deadlineBy;
    /** flag to control migration */
    bool private _migratable = true;
    /** number of migrated tokens */
    uint256 private _migrated = 0;

    /** @param base address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address base, uint256 deadlineIn) {
        _deadlineBy = block.timestamp + deadlineIn;
        _erc20 = ERC20Burnable(base);
    }

    /** migrate old-amount of ERC20 tokens */
    function migrate(uint256 oldAmount) public returns (uint256) {
        return migrateFrom(msg.sender, oldAmount);
    }

    /** migrate old-amount of ERC20 tokens (for account) */
    function migrateFrom(address account, uint256 oldAmount) public virtual returns (uint256) {
        uint256 newAmount = _premigrate(account, oldAmount);
        _mint(account, newAmount);
        return newAmount;
    }

    /** migrate old-amount of ERC20 tokens (w/o minting new ones) */
    function _premigrate(address account, uint256 oldAmount) internal returns (uint256) {
        require(_migratable, "migration sealed");
        uint256 timestamp = block.timestamp;
        require(_deadlineBy >= timestamp, "deadline passed");
        _erc20.burnFrom(account, oldAmount);
        require(oldAmount > 0, "non-positive amount");
        uint256 newAmount = newUnits(oldAmount);
        _incrementCounter(newAmount);
        return newAmount;
    }

    /** @return forward-converted new-amount w.r.t. decimals */
    function newUnits(uint256 oldAmount) public view returns (uint256) {
        if (decimals() >= _erc20.decimals()) {
            return oldAmount * (10 ** (decimals() - _erc20.decimals()));
        } else {
            return oldAmount / (10 ** (_erc20.decimals() - decimals()));
        }
    }

    /** @return backward-converted old-amount w.r.t. decimals */
    function oldUnits(uint256 newAmount) public view returns (uint256) {
        if (decimals() >= _erc20.decimals()) {
            return newAmount / (10 ** (decimals() - _erc20.decimals()));
        } else {
            return newAmount * (10 ** (_erc20.decimals() - decimals()));
        }
    }

    /** @return number of migrated tokens */
    function migrated() public view returns (uint256) {
        return _migrated;
    }

    /** seal migration (manually) */
    function seal() public virtual onlyRole(0x0) {
        _migratable = false;
    }

    /** increment migration counter */
    function _incrementCounter(uint256 amount) internal {
        _migrated += amount;
    }

    /** returns true if this contract implements the interface defined by interfaceId */
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
    /** seal migration (manually) */
    function seal() public override onlyRole(MOE_SEAL_ROLE) {
        super.seal();
    }

    /** returns true if this contract implements the interface defined by interfaceId */
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
    /** @param base address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address moe, address base, uint256 deadlineIn) Migratable(base, deadlineIn) {
        _moe = MoeMigratable(moe);
    }

    /** migrate old-amount of SOV tokens (for account) */
    function migrateFrom(address account, uint256 oldAmount) public override returns (uint256) {
        uint256 newAmountSov = newUnits(oldAmount);
        uint256 migAmountSov = _premigrate(account, oldAmount);
        assert(migAmountSov == newAmountSov);
        uint256 newAmountMoe = moeUnits(newAmountSov);
        uint256 oldAmountMoe = _moe.oldUnits(newAmountMoe);
        uint256 migAmountMoe = _moe.migrateFrom(account, oldAmountMoe);
        assert(migAmountMoe == newAmountMoe);
        _moe.transferFrom(account, (address)(this), migAmountMoe);
        _mint(account, newAmountSov);
        return newAmountSov;
    }

    /** @return cross-converted moe-amount w.r.t. decimals */
    function moeUnits(uint256 sovAmount) public view returns (uint256) {
        if (decimals() >= _moe.decimals()) {
            return sovAmount / (10 ** (decimals() - _moe.decimals()));
        } else {
            return sovAmount * (10 ** (_moe.decimals() - decimals()));
        }
    }

    /** @return cross-converted sov-amount w.r.t. decimals */
    function sovUnits(uint256 moeAmount) public view returns (uint256) {
        if (decimals() >= _moe.decimals()) {
            return moeAmount * (10 ** (decimals() - _moe.decimals()));
        } else {
            return moeAmount / (10 ** (_moe.decimals() - decimals()));
        }
    }

    /** seal migration (manually) */
    function seal() public override onlyRole(SOV_SEAL_ROLE) {
        super.seal();
    }

    /** returns true if this contract implements the interface defined by interfaceId */
    function supportsInterface(bytes4 interfaceId) public view virtual override(Migratable, Supervised) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
