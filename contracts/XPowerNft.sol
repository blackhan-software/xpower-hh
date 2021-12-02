// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
<<<<<<< HEAD
// SPDX-License-Identifier: GPL-3.0
=======
// SPDX-License-Identifier: MIT
>>>>>>> 54e16f3 (XPower NFTs: 2021)
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
 * NFT base class for the XPOW-CPU, XPOW-GPU & XPOW-ASIC proof-of-work tokens,
 * where each NFT can only be minted by burning the corresponding amount.
 */
contract XPowerNft is ERC1155, ERC1155Burnable, ERC1155Supply, URIMalleable, MigratableNft {
    /** NFT kinds: UNIT, ..., YOTTA *or* higher! */
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

    /** create `amount` tokens of token type `kind` */
    function mint(uint256 kind, uint256 amount) public {
        require(kind % 3 == 0, "non-ternary kind");
        uint256 xpow = amount * (10**kind);
        require(xpow > 0, "non-positive amount");
        _xpower.burnFrom(msg.sender, xpow);
        _mint(msg.sender, idBy(year(), kind), amount, "");
    }

    /** create `amounts` tokens of token types `kinds` */
    function mintBatch(uint256[] memory kinds, uint256[] memory amounts) public {
        uint256 xpow = 0;
        for (uint256 i = 0; i < kinds.length; i++) {
            require(kinds[i] % 3 == 0, "non-ternary kind");
            uint256 delta = amounts[i] * (10**kinds[i]);
            require(delta > 0, "non-positive amount");
            xpow += delta;
        }
        _xpower.burnFrom(msg.sender, xpow);
        _mintBatch(msg.sender, idsBy(year(), kinds), amounts, "");
    }

    /** @return current number of years since anno domini */
    function year() public view returns (uint256) {
        uint256 y = (100 * block.timestamp) / (365_25 days);
        require(y > 0, "invalid year");
        return y + 1970;
    }

    /** @return id composed of (year, kind) */
    function idBy(uint256 _year, uint256 kind) public pure returns (uint256) {
        require(kind < 100, "invalid kind");
        return _year * 100 + kind;
    }

    /** @return ids composed of [(year, kind) for kind in kinds] */
    function idsBy(uint256 _year, uint256[] memory kinds) public pure returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](kinds.length);
        for (uint256 i = 0; i < kinds.length; i++) {
            ids[i] = idBy(_year, kinds[i]);
        }
        return ids;
    }

    /** destroy `amount` tokens of token type `id` from `from` */
    function _burn(
        address from,
        uint256 id,
        uint256 amount
    ) internal override(ERC1155) {
        super._burn(from, id, amount);
    }

    /** destroy `amounts` tokens of token types `kinds` from `from` */
    function _burnBatch(
        address from,
        uint256[] memory kinds,
        uint256[] memory amounts
    ) internal override(ERC1155) {
        super._burnBatch(from, kinds, amounts);
    }

    /** create `amount` tokens of token type `id`, and assigns them to `to` */
    function _mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override(ERC1155) {
        super._mint(to, id, amount, data);
    }

    /** create `amounts` tokens of token types `kinds`, and assigns them to `to` */
    function _mintBatch(
        address to,
        uint256[] memory kinds,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155) {
        super._mintBatch(to, kinds, amounts, data);
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
 * NFT class for XPOW.CPU tokens: only the latter are allowed to get burned,
 * to mint the XPOW.CPU NFTs.
 */
contract XPowerCpuNft is XPowerNft {
    constructor(
        string memory uri,
        address xpower,
        address base
    ) XPowerNft(uri, xpower, base) {}
}

/**
 * NFT class for XPOW.GPU tokens: only the latter are allowed to get burned,
 * to mint the XPOW.GPU NFTs.
 */
contract XPowerGpuNft is XPowerNft {
    constructor(
        string memory uri,
        address xpower,
        address base
    ) XPowerNft(uri, xpower, base) {}
}

/**
 * NFT class for XPOW.ASIC tokens: only the latter are allowed to get burned,
 * to mint the XPOW.ASIC NFTs.
 */
contract XPowerAsicNft is XPowerNft {
    constructor(
        string memory uri,
        address xpower,
        address base
    ) XPowerNft(uri, xpower, base) {}
}
