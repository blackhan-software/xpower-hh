// solhint-disable not-rely-on-time
<<<<<<< HEAD
// SPDX-License-Identifier: GPL-3.0
=======
// SPDX-License-Identifier: MIT
>>>>>>> 54e16f3 (XPower NFTs: 2021)
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";

/**
 * Allows migration of NFTs from an old contract; batch migration is also
 * possible. Further, it is also possible to seal migration manually.
 */
abstract contract MigratableNft is ERC1155, ERC1155Burnable, Ownable {
    /** old contract to migrate from */
    ERC1155Burnable private _token;
    /** flag to control migration */
    bool private _migratable = true;

    /** @param base address of old contract */
    constructor(address base) {
        _token = ERC1155Burnable(base);
    }

    /** import NFT from old contract */
    function migrate(uint256 id, uint256 amount) public virtual {
        require(_migratable, "migration sealed");
        _token.burn(msg.sender, id, amount);
        _mint(msg.sender, id, amount, "");
    }

    /** batch import NFTs from old contract */
    function migrateBatch(uint256[] memory ids, uint256[] memory amounts) public virtual {
        require(_migratable, "migration sealed");
        _token.burnBatch(msg.sender, ids, amounts);
        _mintBatch(msg.sender, ids, amounts, "");
    }

    /** seal migration (manually) */
    function seal() public onlyOwner {
        _migratable = false;
    }
}
