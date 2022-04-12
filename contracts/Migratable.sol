// solhint-disable not-rely-on-time
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * Allows migration of tokens from an old contract upto a certain deadline.
 * Further, it is possible to close down the migration window earlier than
 * the specified deadline.
 */
abstract contract Migratable is ERC20, ERC20Burnable, Ownable {
    /** old contract to migrate from */
    ERC20Burnable private _token;
    /** timestamp of migration deadline */
    uint256 private _deadlineBy;
    /** flag to control migration */
    bool private _migratable = true;
    /** number of migrated tokens */
    uint256 private _migratedTotal = 0;
    uint256 private _migratedOther = 0;
    uint256 private _migratedOwner = 0;

    /** @param base address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address base, uint256 deadlineIn) {
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
        _incrementCounters(amount);
    }

    /** @return number of migrated tokens */
    function migrated() public view returns (uint256) {
        return _migratedTotal;
    }

    /** seal migration (manually) */
    function seal() public onlyOwner {
        _migratable = false;
    }

    /** track migration counters */
    function _incrementCounters(uint256 amount) internal {
        if (msg.sender == owner()) {
            _migratedOwner += amount;
        } else {
            _migratedOther += amount;
        }
        _migratedTotal += amount;
    }
}
