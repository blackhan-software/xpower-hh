// SPDX-License-Identifier: GPL-3.0
// solhint-disable no-empty-blocks
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {XPower} from "./XPower.sol";
import {SovMigratable} from "./base/Migratable.sol";

/**
 * Class for the APOW tokens, where only the owner of the contract i.e the
 * MoeTreasury is entitled to mint them.
 */
contract APower is ERC20, ERC20Burnable, SovMigratable, Ownable {
    /** (burnable) proof-of-work tokens */
    XPower private _moe;

    /** @param moeLink address of XPower tokens */
    /** @param sovBase address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(
        address moeLink,
        address[] memory sovBase,
        uint256 deadlineIn
    )
        // ERC20 constructor: name, symbol
        ERC20("APower", "APOW")
        // Migratable: XPower, old APower & rel. deadline [seconds]
        SovMigratable(moeLink, sovBase, deadlineIn)
    {
        _moe = XPower(moeLink);
    }

    /** @return number of decimals of representation */
    function decimals() public view virtual override returns (uint8) {
        return _moe.decimals();
    }

    /** mint amount of tokens for beneficiary (after wrapping XPower) */
    function mint(address to, uint256 amount) external onlyOwner {
        assert(_moe.transferFrom(owner(), address(this), wrappable(amount)));
        _mint(to, amount);
    }

    /** @return wrappable XPower maintaining collat (if possible) */
    function wrappable(uint256 amount) public view returns (uint256) {
        uint256 balance = _moe.balanceOf(address(this));
        uint256 supply = amount + this.totalSupply();
        if (supply > balance) {
            uint256 treasury = _moe.balanceOf(owner());
            return Math.min(treasury, supply - balance);
        }
        return 0;
    }

    /** burn amount of tokens from caller (and then unwrap XPower) */
    function burn(uint256 amount) public override {
        super.burn(amount);
        _moe.transfer(msg.sender, unwrappable(amount));
    }

    /**
     * burn amount of tokens from account, deducting from the caller's
     * allowance (and then unwrap XPower)
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        _moe.transfer(account, unwrappable(amount));
    }

    /** @return unwrappable XPower proportional to burned APower amount */
    function unwrappable(uint256 amount) public view returns (uint256) {
        uint256 balance = _moe.balanceOf(address(this));
        uint256 supply = amount + this.totalSupply();
        if (supply > 0) {
            return (amount * balance) / supply;
        }
        return 0;
    }

    /** @return collateralization ratio with 1'000'000 ~ 100% */
    function collateralization() external view returns (uint256) {
        uint256 balance = _moe.balanceOf(address(this));
        uint256 supply = this.totalSupply();
        if (supply > 0) {
            return (1e6 * balance) / supply;
        }
        return 0;
    }
}
