// solhint-disable not-rely-on-time
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";

/**
 * Allows migration of NFTs from an old contract; batch migration is also
 * possible. Further, manually sealing the migration is also possible.
 */
abstract contract MigratableNft is ERC1155, ERC1155Burnable, Ownable {
    /** old contract to migrate from */
    ERC1155Burnable private _token;
    /** timestamp of migration deadline */
    uint256 private _deadlineBy;
    /** flag to control migration */
    bool private _migratable = true;

    /** @param base address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(address base, uint256 deadlineIn) {
        _deadlineBy = block.timestamp + deadlineIn;
        _token = ERC1155Burnable(base);
    }

    /** import NFT from old contract */
    function migrate(uint256 nftId, uint256 amount) public {
        require(_migratable, "migration sealed");
        uint256 timestamp = block.timestamp;
        require(_deadlineBy >= timestamp, "deadline passed");
        _token.burn(msg.sender, nftId, amount);
        require(amount > 0, "non-positive amount");
        _mint(msg.sender, nftId, amount, "");
    }

    /** batch import NFTs from old contract */
    function migrateBatch(uint256[] memory nftIds, uint256[] memory amounts) public {
        require(_migratable, "migration sealed");
        uint256 timestamp = block.timestamp;
        require(_deadlineBy >= timestamp, "deadline passed");
        _token.burnBatch(msg.sender, nftIds, amounts);
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "non-positive amount");
        }
        _mintBatch(msg.sender, nftIds, amounts, "");
    }

    /** seal migration (manually) */
    function seal() public onlyOwner {
        _migratable = false;
    }
}
