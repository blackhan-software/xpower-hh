// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "./Supervised.sol";

/**
 * Allows changing of the NFT's URI (by the URI_DATA_ROLE), where the URI
 * should e.g. redirect permanently (301) to a corresponding IPFS address.
 */
abstract contract URIMalleable is ERC1155, Supervised {
    function setURI(string memory newuri) public onlyRole(URI_DATA_ROLE) {
        _setURI(newuri);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, Supervised) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
