// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

/**
 * Allows changing of the NFT's URI (by only the URI_ROLE), where the URI
 * should e.g. redirect permanently (301) to a corresponding IPFS address.
 */
abstract contract URIMalleable is ERC1155, AccessControl {
    bytes32 public constant URI_ROLE = keccak256("URI_ROLE");

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setURI(string memory newuri) public onlyRole(URI_ROLE) {
        _setURI(newuri);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return ERC1155.supportsInterface(interfaceId) || AccessControl.supportsInterface(interfaceId);
    }
}
