// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

/**
 * Allows changing of the NFT's URI (by only the contract owner), where the URI
 * should redirect permanently (301) to e.g. a corresponding IPFS address.
 */
abstract contract URIMalleable is ERC1155, Ownable {
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }
}
