// SPDX-License-Identifier: GPL-3.0
// solhint-disable reason-string
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Supervised, TransferableSupervised} from "./Supervised.sol";

/**
 * Allows transfer of contract's ownership to a new account.
 */
abstract contract Transferable is TransferableSupervised, Ownable {
    /** transfer ownership of the contract to a new account */
    function transferOwnership(
        address newOwner
    ) public override onlyRole(TRANSFER_ROLE) {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    /** @return true if this contract implements the interface defined by interface-id */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(Supervised) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
