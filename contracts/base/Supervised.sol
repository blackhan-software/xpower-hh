// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import {AccessControlEnumerable} from "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

abstract contract Supervised is AccessControlEnumerable {
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /** @return true if this contract implements the interface defined by interfaceId */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

abstract contract XPowerSupervised is Supervised {
    /** role grants right to change treasury's share per mint */
    bytes32 public constant SHARE_ROLE = keccak256("SHARE_ROLE");
    bytes32 public constant SHARE_ADMIN_ROLE = keccak256("SHARE_ADMIN_ROLE");

    constructor() {
        _setRoleAdmin(SHARE_ROLE, SHARE_ADMIN_ROLE);
        _grantRole(SHARE_ADMIN_ROLE, msg.sender);
    }
}

abstract contract MoeTreasurySupervised is Supervised {
    /** role grants right to change APR parametrization */
    bytes32 public constant APR_ROLE = keccak256("APR_ROLE");
    bytes32 public constant APR_ADMIN_ROLE = keccak256("APR_ADMIN_ROLE");
    /** role grants right to change APR bonus parametrization */
    bytes32 public constant APR_BONUS_ROLE = keccak256("APR_BONUS_ROLE");
    bytes32 public constant APR_BONUS_ADMIN_ROLE = keccak256("APR_BONUS_ADMIN_ROLE");

    constructor() {
        _setRoleAdmin(APR_ROLE, APR_ADMIN_ROLE);
        _grantRole(APR_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(APR_BONUS_ROLE, APR_BONUS_ADMIN_ROLE);
        _grantRole(APR_BONUS_ADMIN_ROLE, msg.sender);
    }
}

abstract contract MoeMigratableSupervised is Supervised {
    /** role grants right to seal MOE migration */
    bytes32 public constant MOE_SEAL_ROLE = keccak256("MOE_SEAL_ROLE");
    bytes32 public constant MOE_SEAL_ADMIN_ROLE = keccak256("MOE_SEAL_ADMIN_ROLE");

    constructor() {
        _setRoleAdmin(MOE_SEAL_ROLE, MOE_SEAL_ADMIN_ROLE);
        _grantRole(MOE_SEAL_ADMIN_ROLE, msg.sender);
    }
}

abstract contract SovMigratableSupervised is Supervised {
    /** role grants right to seal SOV migration */
    bytes32 public constant SOV_SEAL_ROLE = keccak256("SOV_SEAL_ROLE");
    bytes32 public constant SOV_SEAL_ADMIN_ROLE = keccak256("SOV_SEAL_ADMIN_ROLE");

    constructor() {
        _setRoleAdmin(SOV_SEAL_ROLE, SOV_SEAL_ADMIN_ROLE);
        _grantRole(SOV_SEAL_ADMIN_ROLE, msg.sender);
    }
}

abstract contract NftMigratableSupervised is Supervised {
    /** role grants right to seal NFT migration */
    bytes32 public constant NFT_SEAL_ROLE = keccak256("NFT_SEAL_ROLE");
    bytes32 public constant NFT_SEAL_ADMIN_ROLE = keccak256("NFT_SEAL_ADMIN_ROLE");

    constructor() {
        _setRoleAdmin(NFT_SEAL_ROLE, NFT_SEAL_ADMIN_ROLE);
        _grantRole(NFT_SEAL_ADMIN_ROLE, msg.sender);
    }
}

abstract contract URIMalleableSupervised is Supervised {
    /** role grants right to change metadata URIs */
    bytes32 public constant URI_DATA_ROLE = keccak256("URI_DATA_ROLE");
    bytes32 public constant URI_DATA_ADMIN_ROLE = keccak256("URI_DATA_ADMIN_ROLE");

    constructor() {
        _setRoleAdmin(URI_DATA_ROLE, URI_DATA_ADMIN_ROLE);
        _grantRole(URI_DATA_ADMIN_ROLE, msg.sender);
    }
}
