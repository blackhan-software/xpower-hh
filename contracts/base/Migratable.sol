// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
// solhint-disable one-contract-per-file
// solhint-disable reason-string
pragma solidity 0.8.20;

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
    mapping(address => uint256) private _index;
    /** timestamp of immigration deadline */
    uint256 private _deadlineBy;
    /** flag to seal immigration */
    bool[] private _sealed;
    /** number of immigrated tokens */
    uint256 private _migrated;

    /**
     * @param base addresses of old contracts
     * @param deadlineIn seconds to end-of-migration
     */
    constructor(address[] memory base, uint256 deadlineIn) {
        _deadlineBy = block.timestamp + deadlineIn;
        _base = new ERC20Burnable[](base.length);
        _sealed = new bool[](base.length);
        for (uint256 i = 0; i < base.length; i++) {
            _base[i] = ERC20Burnable(base[i]);
            _index[base[i]] = i;
        }
    }

    /**
     * @param base address of old contract
     * @return index of base address
     */
    function oldIndexOf(address base) external view returns (uint256) {
        return _index[base];
    }

    /**
     * migrate amount of ERC20 tokens
     *
     * @param amount of ERC20s to migrate
     * @param index single of base contract
     */
    function migrate(
        uint256 amount,
        uint256[] memory index
    ) external returns (uint256) {
        return _migrateFrom(msg.sender, amount, index);
    }

    /**
     * migrate amount of ERC20 tokens
     *
     * @param account to migrate from
     * @param amount of ERC20s to migrate
     * @param index single of base contract
     */
    function migrateFrom(
        address account,
        uint256 amount,
        uint256[] memory index
    ) external returns (uint256) {
        require(
            account == msg.sender || approvedMigrate(account, msg.sender),
            "caller is not token owner or approved"
        );
        return _migrateFrom(account, amount, index);
    }

    /** approve migrate by `operator` */
    function approveMigrate(address operator, bool approved) external {
        require(msg.sender != operator, "approving migrate for self");
        _migrateApprovals[msg.sender][operator] = approved;
        emit ApproveMigrate(msg.sender, operator, approved);
    }

    /** @return true if `account` approved migrate by `operator` */
    function approvedMigrate(
        address account,
        address operator
    ) public view returns (bool) {
        return _migrateApprovals[account][operator];
    }

    /** migrate approvals: account => operator */
    mapping(address => mapping(address => bool)) private _migrateApprovals;

    /**
     * emitted when `account` grants or revokes permission to
     * `operator` to migrate their tokens according to `approved`
     */
    event ApproveMigrate(
        address indexed account,
        address indexed operator,
        bool approved
    );

    /** migrate amount of ERC20 tokens */
    function _migrateFrom(
        address account,
        uint256 amount,
        uint256[] memory index
    ) internal virtual returns (uint256) {
        uint256 minAmount = Math.min(
            amount,
            _base[index[0]].balanceOf(account)
        );
        uint256 newAmount = _premigrate(account, minAmount, index[0]);
        _mint(account, newAmount);
        return newAmount;
    }

    /** migrate amount of ERC20 tokens */
    function _premigrate(
        address account,
        uint256 amount,
        uint256 index
    ) internal returns (uint256) {
        require(!_sealed[index], "migration sealed");
        uint256 timestamp = block.timestamp;
        require(_deadlineBy >= timestamp, "deadline passed");
        _base[index].burnFrom(account, amount);
        assert(amount > 0 || amount == 0);
        uint256 newAmount = newUnits(amount, index);
        _migrated += newAmount;
        return newAmount;
    }

    /**
     * @param oldAmount to convert from
     * @param index of base contract
     * @return forward converted new amount w.r.t. decimals
     */
    function newUnits(
        uint256 oldAmount,
        uint256 index
    ) public view returns (uint256) {
        if (decimals() >= _base[index].decimals()) {
            return oldAmount * (10 ** (decimals() - _base[index].decimals()));
        } else {
            return oldAmount / (10 ** (_base[index].decimals() - decimals()));
        }
    }

    /**
     * @param newAmount to convert from
     * @param index of base contract
     * @return backward converted old amount w.r.t. decimals
     */
    function oldUnits(
        uint256 newAmount,
        uint256 index
    ) public view returns (uint256) {
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

    /**
     * seal immigration
     *
     * @param index of base contract
     */
    function _seal(uint256 index) internal {
        _sealed[index] = true;
        emit Seal(index);
    }

    event Seal(uint256 index);

    /** seal-all immigration */
    function _sealAll() internal {
        for (uint256 i = 0; i < _sealed.length; i++) {
            _sealed[i] = true;
        }
        emit SealAll();
    }

    event SealAll();

    /** @return seal flags (of all bases) */
    function seals() public view returns (bool[] memory) {
        return _sealed;
    }

    /** @return true if this contract implements the interface defined by interface-id */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override returns (bool) {
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
    /** @param base addresses of old contracts */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(
        address[] memory base,
        uint256 deadlineIn
    ) Migratable(base, deadlineIn) {}

    /** seal migration */
    function seal(uint256 index) external onlyRole(MOE_SEAL_ROLE) {
        _seal(index);
    }

    /** seal-all migration */
    function sealAll() external onlyRole(MOE_SEAL_ROLE) {
        _sealAll();
    }

    /** @return true if this contract implements the interface defined by interface-id */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(Migratable, Supervised) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

/**
 * Allows migration of SOV tokens from an old contract upto a certain deadline.
 */
abstract contract SovMigratable is Migratable, SovMigratableSupervised {
    /** migratable MOE tokens */
    MoeMigratable private _moeMigratable;

    /** @param moe address of MOE tokens */
    /** @param base addresses of old contracts */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(
        address moe,
        address[] memory base,
        uint256 deadlineIn
    ) Migratable(base, deadlineIn) {
        _moeMigratable = MoeMigratable(moe);
    }

    /**
     * migrate amount of SOV tokens
     *
     * @param account to migrate from
     * @param amount of ERC20s to migrate
     * @param index pair of [sov_index, moe_index]
     */
    ///
    /// @dev assumes old (XPower:APower) == new (XPower:APower) w.r.t. decimals
    ///
    function _migrateFrom(
        address account,
        uint256 amount,
        uint256[] memory index
    ) internal override returns (uint256) {
        uint256[] memory moeIndex = new uint256[](1);
        moeIndex[0] = index[1]; // drop sov-index
        uint256 newAmountSov = newUnits(amount, index[0]);
        uint256 migAmountSov = _premigrate(account, amount, index[0]);
        assert(migAmountSov == newAmountSov);
        uint256 newAmountMoe = moeUnits(newAmountSov);
        uint256 oldAmountMoe = _moeMigratable.oldUnits(newAmountMoe, moeIndex[0]);
        uint256 migAmountMoe = _moeMigratable.migrateFrom(account, oldAmountMoe, moeIndex);
        assert(_moeMigratable.transferFrom(account, (address)(this), migAmountMoe));
        _mint(account, newAmountSov);
        return newAmountSov;
    }

    /**
     * @param sovAmount to convert from
     * @return cross-converted MOE amount w.r.t. decimals
     */
    function moeUnits(uint256 sovAmount) public view returns (uint256) {
        if (decimals() >= _moeMigratable.decimals()) {
            return sovAmount / (10 ** (decimals() - _moeMigratable.decimals()));
        } else {
            return sovAmount * (10 ** (_moeMigratable.decimals() - decimals()));
        }
    }

    /**
     * @param moeAmount to convert from
     * @return cross-converted SOV amount w.r.t. decimals
     */
    function sovUnits(uint256 moeAmount) public view returns (uint256) {
        if (decimals() >= _moeMigratable.decimals()) {
            return moeAmount * (10 ** (decimals() - _moeMigratable.decimals()));
        } else {
            return moeAmount / (10 ** (_moeMigratable.decimals() - decimals()));
        }
    }

    /** seal migration */
    function seal(uint256 index) external onlyRole(SOV_SEAL_ROLE) {
        _seal(index);
    }

    /** seal-all migration */
    function sealAll() external onlyRole(SOV_SEAL_ROLE) {
        _sealAll();
    }

    /** @return true if this contract implements the interface defined by interface-id */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(Migratable, Supervised) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
