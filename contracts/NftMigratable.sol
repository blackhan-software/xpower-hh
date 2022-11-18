// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "./Supervised.sol";

/**
 * Allows migration of NFTs from an old contract; batch migration is also
 * possible. Further, manually sealing the migration is possible too.
 */
abstract contract NftMigratable is ERC1155, ERC1155Burnable, NftMigratableSupervised {
    /** burnable ERC1155 tokens */
    ERC1155Burnable private _erc1155;
    /** timestamp of migration deadline */
    uint256 private _deadlineBy;
    /** flag to control migration */
    bool private _migratable = true;

    /** @param base address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address base, uint256 deadlineIn) {
        _deadlineBy = block.timestamp + deadlineIn;
        _erc1155 = ERC1155Burnable(base);
    }

    /** import NFT from old contract */
    function migrate(uint256 nftId, uint256 amount) public {
        migrateFrom(msg.sender, nftId, amount);
    }

    /** import NFT from old contract (for account) */
    function migrateFrom(address account, uint256 nftId, uint256 amount) public {
        require(_migratable, "migration sealed");
        uint256 timestamp = block.timestamp;
        require(_deadlineBy >= timestamp, "deadline passed");
        _erc1155.burn(account, nftId, amount);
        require(amount > 0, "non-positive amount");
        _mint(account, nftId, amount, "");
    }

    /** batch import NFTs from old contract */
    function migrateBatch(uint256[] memory nftIds, uint256[] memory amounts) public {
        migrateFromBatch(msg.sender, nftIds, amounts);
    }

    /** batch import NFTs from old contract (for account) */
    function migrateFromBatch(address account, uint256[] memory nftIds, uint256[] memory amounts) public {
        require(_migratable, "migration sealed");
        uint256 timestamp = block.timestamp;
        require(_deadlineBy >= timestamp, "deadline passed");
        _erc1155.burnBatch(account, nftIds, amounts);
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "non-positive amount");
        }
        _mintBatch(account, nftIds, amounts, "");
    }

    /** seal migration (manually) */
    function seal() public onlyRole(NFT_SEAL_ROLE) {
        _migratable = false;
    }

    /** returns true if this contract implements the interface defined by interfaceId */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, Supervised) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
