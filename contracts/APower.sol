// SPDX-License-Identifier: GPL-3.0
// solhint-disable no-empty-blocks
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

import "./XPower.sol";
import "./Migratable.sol";

/**
 * Abstract base class for the APower aTHOR, aLOKI and aODIN tokens, where only
 * the owner of the contract i.e the MoeTreasury is entitled to mint them.
 */
abstract contract APower is ERC20, ERC20Burnable, SovMigratable, Ownable {
    /** (burnable) proof-of-work tokens */
    XPower private _moe;

    /** @param symbol short token symbol */
    /** @param sovBase address of old contract */
    /** @param moeLink address of contract for MOE tokens */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(
        string memory symbol,
        address sovBase,
        address moeLink,
        uint256 deadlineIn
    )
        // ERC20 constructor: name, symbol
        ERC20("APower", symbol)
        // Migratable: old contract, rel. deadline [seconds]
        Migratable(sovBase, deadlineIn)
    {
        _moe = XPower(moeLink);
    }

    /** mint amount of tokens for beneficiary (after wrapping XPower) */
    function mint(address to, uint256 amount) public onlyOwner {
        _moe.transferFrom(owner(), (address)(this), amount);
        _mint(to, amount);
    }

    /** burn amount of tokens from caller (and then unwrap XPower) */
    function burn(uint256 amount) public override {
        super.burn(amount);
        _moe.transfer(msg.sender, amount);
    }

    /**
     * burn amount of tokens from account, deducting from the caller's
     * allowance (and then unwrap XPower)
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        _moe.transfer(account, amount);
    }
}

contract APowerThor is APower {
    /** @param sovBase address of old contract */
    /** @param moeLink address of contract for XPower tokens */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address sovBase, address moeLink, uint256 deadlineIn) APower("aTHOR", sovBase, moeLink, deadlineIn) {}
}

contract APowerLoki is APower {
    /** @param base address of old contract */
    /** @param moe address of contract for XPower tokens */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address sovBase, address moeLink, uint256 deadlineIn) APower("aLOKI", sovBase, moeLink, deadlineIn) {}
}

contract APowerOdin is APower {
    /** @param sovBase address of old contract */
    /** @param moeLink address of contract for XPower tokens */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address sovBase, address moeLink, uint256 deadlineIn) APower("aODIN", sovBase, moeLink, deadlineIn) {}
}
