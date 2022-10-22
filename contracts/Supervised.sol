// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

abstract contract Supervised is AccessControlEnumerable {
    /** role grants right to change APR parametrization */
    bytes32 public constant ALPHA_ROLE = keccak256("ALPHA_ROLE");
    bytes32 public constant ALPHA_ADMIN_ROLE = keccak256("ALPHA_ADMIN_ROLE");
    /** role grants right to change APR bonus parametrization */
    bytes32 public constant GAMMA_ROLE = keccak256("GAMMA_ROLE");
    bytes32 public constant GAMMA_ADMIN_ROLE = keccak256("GAMMA_ADMIN_ROLE");
    /** role grants right to change treasury's share per mint */
    bytes32 public constant DELTA_ROLE = keccak256("DELTA_ROLE");
    bytes32 public constant DELTA_ADMIN_ROLE = keccak256("DELTA_ADMIN_ROLE");
    /** role grants right to change difficulty parametrization */
    bytes32 public constant THETA_ROLE = keccak256("THETA_ROLE");
    bytes32 public constant THETA_ADMIN_ROLE = keccak256("THETA_ADMIN_ROLE");

    /** role grants right to seal MOE migration */
    bytes32 public constant MOE_SEAL_ROLE = keccak256("MOE_SEAL_ROLE");
    bytes32 public constant MOE_SEAL_ADMIN_ROLE = keccak256("MOE_SEAL_ADMIN_ROLE");
    /** role grants right to seal SOV migration */
    bytes32 public constant SOV_SEAL_ROLE = keccak256("SOV_SEAL_ROLE");
    bytes32 public constant SOV_SEAL_ADMIN_ROLE = keccak256("SOV_SEAL_ADMIN_ROLE");
    /** role grants right to seal NFT migration */
    bytes32 public constant NFT_SEAL_ROLE = keccak256("NFT_SEAL_ROLE");
    bytes32 public constant NFT_SEAL_ADMIN_ROLE = keccak256("NFT_SEAL_ADMIN_ROLE");
    /** role grants right to change meta data URIs */
    bytes32 public constant URI_DATA_ROLE = keccak256("URI_DATA_ROLE");
    bytes32 public constant URI_DATA_ADMIN_ROLE = keccak256("URI_DATA_ADMIN_ROLE");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(ALPHA_ROLE, ALPHA_ADMIN_ROLE);
        _grantRole(ALPHA_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(GAMMA_ROLE, GAMMA_ADMIN_ROLE);
        _grantRole(GAMMA_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(DELTA_ROLE, DELTA_ADMIN_ROLE);
        _grantRole(DELTA_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(THETA_ROLE, THETA_ADMIN_ROLE);
        _grantRole(THETA_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(MOE_SEAL_ROLE, MOE_SEAL_ADMIN_ROLE);
        _grantRole(MOE_SEAL_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(SOV_SEAL_ROLE, SOV_SEAL_ADMIN_ROLE);
        _grantRole(SOV_SEAL_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(NFT_SEAL_ROLE, NFT_SEAL_ADMIN_ROLE);
        _grantRole(NFT_SEAL_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(URI_DATA_ROLE, URI_DATA_ADMIN_ROLE);
        _grantRole(URI_DATA_ADMIN_ROLE, msg.sender);
    }

    /** returns true if this contract implements the interface defined by interfaceId. */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
