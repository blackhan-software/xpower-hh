// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
// solhint-disable reason-string
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
    function oldIndexOf(address base) public view returns (uint256) {
        return _index[base];
    }

    /** migrate amount of ERC1155 */
    function migrate(uint256 nftId, uint256 amount, uint256[] memory index) public {
        migrateFrom(msg.sender, nftId, amount, index);
    }

    /** migrate amount of ERC1155 (for account) */
    function migrateFrom(address account, uint256 nftId, uint256 amount, uint256[] memory index) public {
        uint256 timestamp = block.timestamp;
        require(_deadlineBy >= timestamp, "deadline passed");
        _burnFrom(account, nftId, amount, index);
        _mint(account, nftId, amount, "");
    }

    /** burn amount of ERC1155 (for account) */
    function _burnFrom(address account, uint256 nftId, uint256 amount, uint256[] memory index) private {
        require(amount > 0, "non-positive amount");
        uint256 tryId = nftId % _eonOf(_yearOf(nftId));
        assert(tryId > 0); // cannot be zero
        uint256 prefix = _prefixOf(nftId);
        assert(prefix > 0); // cannot be zero
        uint256 tidx = prefix <= index.length ? prefix - 1 : index.length - 1;
        assert(tidx >= 0); // token index: zero *or* larger
        require(!_sealed[index[tidx]], "migration sealed");
        uint256 tryBalance = _base[index[tidx]].balanceOf(account, tryId);
        _base[index[tidx]].burn(account, tryBalance > 0 ? tryId : nftId, amount);
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
        uint256 timestamp = block.timestamp;
        require(_deadlineBy >= timestamp, "deadline passed");
        for (uint256 i = 0; i < nftIds.length; i++) {
            _burnFrom(account, nftIds[i], amounts[i], index);
        }
        _mintBatch(account, nftIds, amounts, "");
    }

    /** seal migration (manually) */
    function seal(uint256 index) public onlyRole(NFT_SEAL_ROLE) {
        _sealed[index] = true;
    }

    /** seal-all migration (manually) */
    function sealAll() public onlyRole(NFT_SEAL_ROLE) {
        for (uint256 i = 0; i < _sealed.length; i++) {
            seal(i);
        }
    }

    /** @return seal flags (for all bases) */
    function seals() public view returns (bool[] memory) {
        return _sealed;
    }

    /** @return true if this contract implements the interface defined by interfaceId */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, Supervised) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _prefixOf(uint256 nftId) internal pure returns (uint256) {
        uint256 prefix = nftId / _eonOf(_yearOf(nftId));
        require(prefix > 0, "invalid prefix");
        return prefix;
    }

    /** @return eon the given year belongs to: 1M, 10M, 100M, ... */
    function _eonOf(uint256 anno) internal pure returns (uint256) {
        uint256 eon = 10_000;
        while (anno / eon > 0) {
            eon *= 10;
        }
        return 100 * eon;
    }

    /** @return year of nft-id (2021, 2022, ...) */
    function _yearOf(uint256 nftId) internal pure returns (uint256) {
        uint256 anno = (nftId / 100) % 10_000;
        require(anno > 2020, "invalid year");
        return anno;
    }
}
