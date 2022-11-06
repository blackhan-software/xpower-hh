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
    /** old contract to migrate from */
    ERC20Burnable private _token;
    /** timestamp of migration deadline */
    uint256 private _deadlineBy;
    /** flag to control migration */
    bool private _migratable = true;
    /** number of migrated tokens */
    uint256 private _migratedTotal = 0;

    /** @param base address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address base, uint256 deadlineIn) {
        _deadlineBy = block.timestamp + deadlineIn;
        _token = ERC20Burnable(base);
    }

    /** import amount from old contract */
    function migrate(uint256 oldAmount) public {
        require(_migratable, "migration sealed");
        uint256 timestamp = block.timestamp;
        require(_deadlineBy >= timestamp, "deadline passed");
        uint256 myAllowance = _token.allowance(msg.sender, address(this));
        require(oldAmount <= myAllowance, "insufficient allowance");
        uint256 oldBalance = _token.balanceOf(msg.sender);
        require(oldAmount <= oldBalance, "insufficient balance");
        _token.burnFrom(msg.sender, oldAmount);
        uint256 newBalance = _token.balanceOf(msg.sender);
        require(newBalance + oldAmount == oldBalance, "invalid balance");
        require(decimals() >= _token.decimals(), "invalid decimals");
        uint8 deltaExponent = decimals() - _token.decimals();
        uint256 newAmount = oldAmount * 10 ** deltaExponent;
        _mint(msg.sender, newAmount);
        _incrementCounter(newAmount);
    }

    /** @return number of migrated tokens */
    function migrated() public view returns (uint256) {
        return _migratedTotal;
    }

    /** seal migration (manually) */
    function seal() public virtual onlyRole(0x0) {
        _migratable = false;
    }

    /** track migration counter */
    function _incrementCounter(uint256 amount) internal {
        _migratedTotal += amount;
    }

    /** returns true if this contract implements the interface defined by interfaceId. */
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
abstract contract MoeMigratable is Migratable {
    function seal() public override onlyRole(MOE_SEAL_ROLE) {
        super.seal();
    }
}

/**
 * Allows migration of SOV tokens from an old contract upto a certain deadline.
 */
abstract contract SovMigratable is Migratable {
    function seal() public override onlyRole(SOV_SEAL_ROLE) {
        super.seal();
    }
}
