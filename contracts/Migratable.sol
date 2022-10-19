// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * Allows migration of tokens from an old contract upto a certain deadline.
 * Further, it is possible to close down the migration window earlier than
 * the specified deadline.
 */
abstract contract Migratable is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant SEAL_ROLE = keccak256("SEAL_ROLE");

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
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _deadlineBy = block.timestamp + deadlineIn;
        _token = ERC20Burnable(base);
    }

    /** import amount from old contract */
    function migrate(uint256 amount) public {
        require(_migratable, "migration sealed");
        uint256 timestamp = block.timestamp;
        require(_deadlineBy >= timestamp, "deadline passed");
        uint256 myAllowance = _token.allowance(msg.sender, address(this));
        require(amount <= myAllowance, "insufficient allowance");
        uint256 oldBalance = _token.balanceOf(msg.sender);
        require(amount <= oldBalance, "insufficient balance");
        _token.burnFrom(msg.sender, amount);
        uint256 newBalance = _token.balanceOf(msg.sender);
        require(newBalance + amount == oldBalance, "invalid balance");
        _mint(msg.sender, amount);
        _incrementCounter(amount);
    }

    /** @return number of migrated tokens */
    function migrated() public view returns (uint256) {
        return _migratedTotal;
    }

    /** seal migration (manually) */
    function seal() public onlyRole(SEAL_ROLE) {
        _migratable = false;
    }

    /** track migration counter */
    function _incrementCounter(uint256 amount) internal {
        _migratedTotal += amount;
    }

    /** returns true if this contract implements the interface defined by interfaceId. */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return AccessControl.supportsInterface(interfaceId);
    }
}
