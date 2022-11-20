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
    ERC1155Burnable[] private _base;
    /** base address to index map */
    mapping(address => uint) private _index;
    /** timestamp of migration deadline */
    uint256 private _deadlineBy;
    /** flag to seal migrations */
    bool[] private _sealed;

    /** @param base addresses of old contracts */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address[] memory base, uint256 deadlineIn) {
        _deadlineBy = block.timestamp + deadlineIn;
        _base = new ERC1155Burnable[](base.length);
        _sealed = new bool[](base.length);
        for (uint256 i = 0; i < base.length; i++) {
            _base[i] = ERC1155Burnable(base[i]);
            _index[base[i]] = i;
        }
    }

    /** @return index of base address */
    function indexOf(address base) public view returns (uint256) {
        return _index[base];
    }

    /** migrate amount of ERC1155 */
    function migrate(uint256 nftId, uint256 amount, uint256[] memory index) public {
        migrateFrom(msg.sender, nftId, amount, index);
    }

    /** migrate amount of ERC1155 (for account) */
    function migrateFrom(address account, uint256 nftId, uint256 amount, uint256[] memory index) public {
        require(!_sealed[index[0]], "migration sealed");
        uint256 timestamp = block.timestamp;
        require(_deadlineBy >= timestamp, "deadline passed");
        _base[index[0]].burn(account, nftId, amount);
        require(amount > 0, "non-positive amount");
        _mint(account, nftId, amount, "");
    }

    /** batch migrate amounts of ERC1155 */
    function migrateBatch(uint256[] memory nftIds, uint256[] memory amounts, uint256[] memory index) public {
        migrateFromBatch(msg.sender, nftIds, amounts, index);
    }

    /** batch migrate amounts of ERC1155 (for account) */
    function migrateFromBatch(
        address account,
        uint256[] memory nftIds,
        uint256[] memory amounts,
        uint256[] memory index
    ) public {
        require(!_sealed[index[0]], "migration sealed");
        uint256 timestamp = block.timestamp;
        require(_deadlineBy >= timestamp, "deadline passed");
        _base[index[0]].burnBatch(account, nftIds, amounts);
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "non-positive amount");
        }
        _mintBatch(account, nftIds, amounts, "");
    }

    /** seal migration (manually) */
    function seal(uint256 index) public onlyRole(NFT_SEAL_ROLE) {
        _sealed[index] = true;
    }

    /** @return sealed flags (for all bases) */
    function sealedAll() public view returns (bool[] memory) {
        return _sealed;
    }

    /** returns true if this contract implements the interface defined by interfaceId */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, Supervised) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
