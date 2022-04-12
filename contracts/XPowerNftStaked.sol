// SPDX-License-Identifier: GPL-3.0
// solhint-disable no-empty-blocks
// solhint-disable not-rely-on-time
pragma solidity ^0.8.0;

import "./XPowerNftBase.sol";

/**
 * Abstract base class for staked XPowerNft(s): Contract owner only is allowed
 * to mint and burn XPowerNftStaked tokens.
 */
abstract contract XPowerNftStaked is XPowerNftBase {
    /** map of mints: account => nft-id => accumulator [seconds] */
    mapping(address => mapping(uint256 => uint256)) private _mints;
    /** map of burns: account => nft-id => accumulator [seconds] */
    mapping(address => mapping(uint256 => uint256)) private _burns;
    /** map of total mints: nft-id => accumulator [seconds] */
    mapping(uint256 => uint256) private _mintsTotal;
    /** map of total burns: nft-id => accumulator [seconds] */
    mapping(uint256 => uint256) private _burnsTotal;

    /** @param uri meta-data URI */
    /** @param base address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(
        string memory uri,
        address base,
        uint256 deadlineIn
    ) XPowerNftBase(uri, base, deadlineIn) {}

    /** transfer tokens (and reset age) */
    function safeTransferFrom(
        address from,
        address to,
        uint256 nftId,
        uint256 amount,
        bytes memory data
    ) public override {
        _pushBurn(from, nftId, amount);
        _pushMint(to, nftId, amount);
        super.safeTransferFrom(from, to, nftId, amount, data);
    }

    /** batch transfer tokens (and reset age) */
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory nftIds,
        uint256[] memory amounts,
        bytes memory data
    ) public override {
        _pushBurnBatch(from, nftIds, amounts);
        _pushMintBatch(to, nftIds, amounts);
        super.safeBatchTransferFrom(from, to, nftIds, amounts, data);
    }

    /** mint particular amount of staked NFTs for given address and nft-id */
    function mint(
        address to,
        uint256 nftId,
        uint256 amount
    ) public onlyOwner {
        _pushMint(to, nftId, amount);
        _mint(to, nftId, amount, "");
    }

    /** mint particular amounts of staked NFTs for given address and nft-ids */
    function mintBatch(
        address to,
        uint256[] memory nftIds,
        uint256[] memory amounts
    ) public onlyOwner {
        _pushMintBatch(to, nftIds, amounts);
        _mintBatch(to, nftIds, amounts, "");
    }

    /** burn particular amount of staked NFTs for given address and nft-id */
    function burn(
        address from,
        uint256 nftId,
        uint256 amount
    ) public override onlyOwner {
        _pushBurn(from, nftId, amount);
        _burn(from, nftId, amount);
    }

    /** burn particular amounts of staked NFTs for given address and nft-ids */
    function burnBatch(
        address from,
        uint256[] memory nftIds,
        uint256[] memory amounts
    ) public override onlyOwner {
        _pushBurnBatch(from, nftIds, amounts);
        _burnBatch(from, nftIds, amounts);
    }

    /** @return age seconds over all stakes for given address and nft-id */
    function ageOf(address account, uint256 nftId) public view returns (uint256) {
        uint256 mints = _mints[account][nftId];
        uint256 burns = _burns[account][nftId];
        if (mints > burns) {
            uint256 balance = balanceOf(account, nftId);
            uint256 difference = mints - burns;
            return balance * block.timestamp - difference;
        }
        return 0;
    }

    /** @return age seconds totalled over all stakes for given nft-id */
    function totalAgeOf(uint256 nftId) public view returns (uint256) {
        uint256 mintsTotal = _mintsTotal[nftId];
        uint256 burnsTotal = _burnsTotal[nftId];
        if (mintsTotal > burnsTotal) {
            uint256 supply = totalSupply(nftId);
            uint256 difference = mintsTotal - burnsTotal;
            return supply * block.timestamp - difference;
        }
        return 0;
    }

    /** remember mint action */
    function _pushMint(
        address account,
        uint256 nftId,
        uint256 amount
    ) internal {
        require(amount > 0, "non-positive amount");
        _mints[account][nftId] += amount * block.timestamp;
        _mintsTotal[nftId] += amount * block.timestamp;
    }

    /** remember mint actions */
    function _pushMintBatch(
        address account,
        uint256[] memory nftIds,
        uint256[] memory amounts
    ) internal {
        assert(nftIds.length == amounts.length);
        for (uint256 i = 0; i < nftIds.length; i++) {
            _pushMint(account, nftIds[i], amounts[i]);
        }
    }

    /** remember burn action */
    function _pushBurn(
        address account,
        uint256 nftId,
        uint256 amount
    ) internal {
        require(amount > 0, "non-positive amount");
        _burns[account][nftId] += amount * block.timestamp;
        _burnsTotal[nftId] += amount * block.timestamp;
    }

    /** remember burn actions */
    function _pushBurnBatch(
        address account,
        uint256[] memory nftIds,
        uint256[] memory amounts
    ) internal {
        assert(nftIds.length == amounts.length);
        for (uint256 i = 0; i < nftIds.length; i++) {
            _pushBurn(account, nftIds[i], amounts[i]);
        }
    }
}

/**
 * Staked NFT class for PARA tokens.
 */
contract XPowerParaNftStaked is XPowerNftStaked {
    /** @param uri meta-data URI */
    /** @param base address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(
        string memory uri,
        address base,
        uint256 deadlineIn
    ) XPowerNftStaked(uri, base, deadlineIn) {}
}

/**
 * Staked NFT class for AQCH tokens.
 */
contract XPowerAqchNftStaked is XPowerNftStaked {
    /** @param uri meta-data URI */
    /** @param base address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(
        string memory uri,
        address base,
        uint256 deadlineIn
    ) XPowerNftStaked(uri, base, deadlineIn) {}
}

/**
 * Staked NFT class for QRSH tokens.
 */
contract XPowerQrshNftStaked is XPowerNftStaked {
    /** @param uri meta-data URI */
    /** @param base address of old contract */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(
        string memory uri,
        address base,
        uint256 deadlineIn
    ) XPowerNftStaked(uri, base, deadlineIn) {}
}
