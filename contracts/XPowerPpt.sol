// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
// solhint-disable reason-string
pragma solidity ^0.8.20;

import {NftBase} from "./base/NftBase.sol";

/**
 * Abstract base class for staked XPowerNft(s): Only the contract owner i.e.
 * the NftTreasury is allowed to mint and burn XPowerPpt tokens.
 */
contract XPowerPpt is NftBase {
    /** map of age: account => nft-id => accumulator [seconds] */
    mapping(address => mapping(uint256 => int256)) private _age;
    /** map of levels: nft-level => accumulator */
    int256[34] private _shares;

    /** @param pptUri meta-data URI */
    /** @param pptBase addresses of old contracts */
    /** @param deadlineIn seconds to end-of-migration */
    constructor(
        string memory pptUri,
        address[] memory pptBase,
        uint256 deadlineIn
    ) NftBase("XPower PPTs", "XPOWPPT", pptUri, pptBase, deadlineIn) {}

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

    /** mint particular amount of staked NFTs */
    function mint(
        address to,
        uint256 nftId,
        uint256 amount
    ) external onlyOwner {
        _memoMint(to, nftId, amount);
        _mint(to, nftId, amount, "");
    }

    /** mint particular amounts of staked NFTs */
    function mintBatch(
        address to,
        uint256[] memory nftIds,
        uint256[] memory amounts
    ) external onlyOwner {
        require(nftIds.length > 0, "empty ids");
        require(amounts.length > 0, "empty amounts");
        _memoMintBatch(to, nftIds, amounts);
        _mintBatch(to, nftIds, amounts, "");
    }

    /** burn particular amount of staked NFTs */
    function burn(
        address from,
        uint256 nftId,
        uint256 amount
    ) public override onlyOwner {
        _memoBurn(from, nftId, amount);
        _burn(from, nftId, amount);
    }

    /** burn particular amounts of staked NFTs */
    function burnBatch(
        address from,
        uint256[] memory nftIds,
        uint256[] memory amounts
    ) public override onlyOwner {
        require(nftIds.length > 0, "empty ids");
        require(amounts.length > 0, "empty amounts");
        _memoBurnBatch(from, nftIds, amounts);
        _burnBatch(from, nftIds, amounts);
    }

    /** @return age seconds over all stakes */
    function ageOf(
        address account,
        uint256 nftId
    ) external view returns (uint256) {
        int256 age = _age[account][nftId];
        if (age > 0) {
            uint256 balance = balanceOf(account, nftId);
            return balance * block.timestamp - uint256(age);
        }
        return 0;
    }

    /** @return share accumulators */
    function shares() external view returns (int256[34] memory) {
        return _shares;
    }

    /** remember mint action */
    function _pushMint(address to, uint256 nftId, uint256 amount) private {
        _age[to][nftId] += int256(amount * block.timestamp);
    }

    /** remember mint actions */
    function _pushMintBatch(
        address to,
        uint256[] memory nftIds,
        uint256[] memory amounts
    ) private {
        require(
            nftIds.length == amounts.length,
            "ERC1155: ids and amounts length mismatch"
        );
        for (uint256 i = 0; i < nftIds.length; i++)
            _pushMint(to, nftIds[i], amounts[i]);
    }

    /** remember burn action */
    function _pushBurn(address from, uint256 nftId, uint256 amount) private {
        _age[from][nftId] -= int256(amount * block.timestamp);
    }

    /** remember burn actions */
    function _pushBurnBatch(
        address from,
        uint256[] memory nftIds,
        uint256[] memory amounts
    ) private {
        require(
            nftIds.length == amounts.length,
            "ERC1155: ids and amounts length mismatch"
        );
        for (uint256 i = 0; i < nftIds.length; i++)
            _pushBurn(from, nftIds[i], amounts[i]);
    }

    /** remember mint action (incl. accumulators) */
    function _memoMint(address to, uint256 nftId, uint256 amount) private {
        _pushMint(to, nftId, amount);
        uint256 level = levelOf(nftId);
        _shares[level / 3] += int256(amount * 10 ** level);
    }

    /** remember mint actions (incl. accumulators) */
    function _memoMintBatch(
        address to,
        uint256[] memory nftIds,
        uint256[] memory amounts
    ) private {
        require(
            nftIds.length == amounts.length,
            "ERC1155: ids and amounts length mismatch"
        );
        for (uint256 i = 0; i < nftIds.length; i++) {
            _memoMint(to, nftIds[i], amounts[i]);
        }
    }

    /** remember burn action (incl. accumulators) */
    function _memoBurn(address from, uint256 nftId, uint256 amount) private {
        _pushBurn(from, nftId, amount);
        uint256 level = levelOf(nftId);
        _shares[level / 3] -= int256(amount * 10 ** level);
    }

    /** remember burn actions (incl. accumulators) */
    function _memoBurnBatch(
        address form,
        uint256[] memory nftIds,
        uint256[] memory amounts
    ) private {
        require(
            nftIds.length == amounts.length,
            "ERC1155: ids and amounts length mismatch"
        );
        for (uint256 i = 0; i < nftIds.length; i++) {
            _memoBurn(form, nftIds[i], amounts[i]);
        }
    }
}
