// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

import "./MigratableNft.sol";

/**
 * Allows changing of the NFT's URI (by only the contract owner). Then, the URI
 * should redirect permanently (301) to the corresponding IPFS address.
 */
abstract contract URIMalleable is ERC1155, Ownable {
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }
}

/**
 * NFT base class for the PARA, AQCH & QRSH proof-of-work tokens,
 * where each NFT can only be minted by burning the corresponding amount.
 */
contract XPowerNft is ERC1155, ERC1155Burnable, ERC1155Supply, URIMalleable, MigratableNft {
    /** NFT levels: UNIT, ..., YOTTA *or* higher! */
    uint256 public constant UNIT = 0;
    uint256 public constant KILO = 3;
    uint256 public constant MEGA = 6;
    uint256 public constant GIGA = 9;
    uint256 public constant TERA = 12;
    uint256 public constant PETA = 15;
    uint256 public constant EXA = 18;
    uint256 public constant ZETTA = 21;
    uint256 public constant YOTTA = 24;

    /** (Burnable) XPower contract */
    ERC20Burnable private _xpower;

    constructor(
        string memory uri,
        address xpower,
        address base
    )
        // ERC1155 constructor: uri
        ERC1155(uri)
        // MigratableNft: old contract
        MigratableNft(base)
    {
        _xpower = ERC20Burnable(xpower);
    }

    /** mint particular amount of tokens for given level and address */
    function mint(
        address to,
        uint256 level,
        uint256 amount
    ) public {
        require(level % 3 == 0, "non-ternary level");
        uint256 xpow = amount * (10**level);
        require(xpow > 0, "non-positive amount");
        _xpower.burnFrom(to, xpow);
        _mint(to, idBy(year(), level), amount, "");
    }

    /** mint particular amounts of tokens for given level and address */
    function mintBatch(
        address to,
        uint256[] memory levels,
        uint256[] memory amounts
    ) public {
        uint256 xpow = 0;
        for (uint256 i = 0; i < levels.length; i++) {
            require(levels[i] % 3 == 0, "non-ternary level");
            uint256 delta = amounts[i] * (10**levels[i]);
            require(delta > 0, "non-positive amount");
            xpow += delta;
        }
        _xpower.burnFrom(to, xpow);
        _mintBatch(to, idsBy(year(), levels), amounts, "");
    }

    /** @return current number of years since anno domini */
    function year() public view returns (uint256) {
        uint256 y = (100 * block.timestamp) / (365_25 days);
        require(y > 0, "invalid year");
        return y + 1970;
    }

    /** @return ID composed of (year, level) */
    function idBy(uint256 _year, uint256 level) public pure returns (uint256) {
        require(level < 100, "invalid level");
        return _year * 100 + level;
    }

    /** @return IDs composed of [(year, level) for level in levels] */
    function idsBy(uint256 _year, uint256[] memory levels) public pure returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](levels.length);
        for (uint256 i = 0; i < levels.length; i++) {
            ids[i] = idBy(_year, levels[i]);
        }
        return ids;
    }

    /** burn particular amount of certain token(s) from given address */
    function _burn(
        address from,
        uint256 id,
        uint256 amount
    ) internal override(ERC1155) {
        super._burn(from, id, amount);
    }

    /** burn particular amounts of certain token(s) from given address */
    function _burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal override(ERC1155) {
        super._burnBatch(from, ids, amounts);
    }

    /** mint particular amount of certain token(s) for given address */
    function _mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override(ERC1155) {
        super._mint(to, id, amount, data);
    }

    /** mint particular amounts of certain token(s) for given address */
    function _mintBatch(
        address to,
        uint256[] memory levels,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155) {
        super._mintBatch(to, levels, amounts, data);
    }

    /** called before any token transfer; includes (batched) minting and burning */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}

/**
 * NFT class for PARA tokens: only the latter are allowed to get burned,
 * to mint the PARA NFTs.
 */
contract XPowerParaNft is XPowerNft {
    constructor(
        string memory uri,
        address xpower,
        address base
    ) XPowerNft(uri, xpower, base) {}
}

/**
 * NFT class for AQCH tokens: only the latter are allowed to get burned,
 * to mint the AQCH NFTs.
 */
contract XPowerAqchNft is XPowerNft {
    constructor(
        string memory uri,
        address xpower,
        address base
    ) XPowerNft(uri, xpower, base) {}
}

/**
 * NFT class for QRSH tokens: only the latter are allowed to get burned,
 * to mint the QRSH NFTs.
 */
contract XPowerQrshNft is XPowerNft {
    constructor(
        string memory uri,
        address xpower,
        address base
    ) XPowerNft(uri, xpower, base) {}
}
