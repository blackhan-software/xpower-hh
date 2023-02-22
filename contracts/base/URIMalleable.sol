// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Supervised, URIMalleableSupervised} from "./Supervised.sol";

/**
 * Allows changing of the NFT's URI (by the URI_DATA_ROLE), where the URI
 * should e.g. redirect permanently (301) to a corresponding IPFS address.
 *
 * Further, specifies a contract-level metadata URI to support Opensea.io,
 * including a setter (guarded by the same URI_DATA_ROLE).
 */
abstract contract URIMalleable is ERC1155, URIMalleableSupervised {
    /** contract-level metadata URI */
    string private _uriContract;

    /** get contract-level metadata URI */
    function contractURI() public view returns (string memory) {
        return _uriContract;
    }

    /** set contract-level metadata URI */
    function setContractURI(string memory uri) public onlyRole(URI_DATA_ROLE) {
        _uriContract = uri;
    }

    /** set metadata URI (for all token types) */
    function setURI(string memory uri) public onlyRole(URI_DATA_ROLE) {
        _setURI(uri);
    }

    /** @return true if this contract implements the interface defined by interfaceId */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, Supervised) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
