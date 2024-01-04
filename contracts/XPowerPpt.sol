// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
// solhint-disable reason-string
pragma solidity 0.8.20;

import {NftBase} from "./base/NftBase.sol";
import {MoeTreasury} from "./MoeTreasury.sol";

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * Abstract base class for staked XPowerNft(s): Only the contract owner
 * i.e. the NftTreasury is allowed to mint and burn XPowerPpt tokens.
 */
contract XPowerPpt is NftBase {
    /** map of age: account => nft-id => accumulator [seconds] */
    mapping(address => mapping(uint256 => uint256)) private _age;
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

    /** MOE treasury */
    MoeTreasury private _mty;

    /** post-constructor init (once) */
    function init(address mty) external {
        require(address(_mty) == address(0), "already initialized");
        _mty = MoeTreasury(mty);
        emit Init(mty);
    }

    event Init(address mty);

    /** transfer tokens (and reset age) */
    function safeTransferFrom(
        address account,
        address to,
        uint256 nftId,
        uint256 amount,
        bytes memory data
    ) public override {
        _pushBurn(account, nftId, amount);
        _pushMint(to, nftId, amount);
        super.safeTransferFrom(account, to, nftId, amount, data);
    }

    /** batch transfer tokens (and reset age) */
    function safeBatchTransferFrom(
        address account,
        address to,
        uint256[] memory nftIds,
        uint256[] memory amounts,
        bytes memory data
    ) public override {
        _pushBurnBatch(account, nftIds, amounts);
        _pushMintBatch(to, nftIds, amounts);
        super.safeBatchTransferFrom(account, to, nftIds, amounts, data);
    }

    /** mint particular amount of staked NFTs */
    function mint(
        address account,
        uint256 nftId,
        uint256 amount
    ) external onlyOwner {
        _memoMint(account, nftId, amount);
        _mint(account, nftId, amount, "");
    }

    /** mint particular amounts of staked NFTs */
    function mintBatch(
        address account,
        uint256[] memory nftIds,
        uint256[] memory amounts
    ) external onlyOwner {
        require(nftIds.length > 0, "empty ids");
        require(amounts.length > 0, "empty amounts");
        _memoMintBatch(account, nftIds, amounts);
        _mintBatch(account, nftIds, amounts, "");
    }

    /** burn particular amount of staked NFTs */
    function burn(
        address account,
        uint256 nftId,
        uint256 amount
    ) public override onlyOwner {
        _memoBurn(account, nftId, amount);
        _burn(account, nftId, amount);
    }

    /** burn particular amounts of staked NFTs */
    function burnBatch(
        address account,
        uint256[] memory nftIds,
        uint256[] memory amounts
    ) public override onlyOwner {
        require(nftIds.length > 0, "empty ids");
        require(amounts.length > 0, "empty amounts");
        _memoBurnBatch(account, nftIds, amounts);
        _burnBatch(account, nftIds, amounts);
    }

    /** @return age seconds over all stakes */
    function ageOf(
        address account,
        uint256 nftId
    ) external view returns (uint256) {
        uint256 age = _age[account][nftId];
        if (age > 0) {
            uint256 balance = balanceOf(account, nftId);
            return balance * block.timestamp - age;
        }
        return 0;
    }

    /** @return share accumulators */
    function shares() external view returns (int256[34] memory) {
        return _shares;
    }

    /** remember mint action */
    function _pushMint(address account, uint256 nftId, uint256 amount) private {
        _age[account][nftId] += amount * block.timestamp;
    }

    /** remember mint actions */
    function _pushMintBatch(
        address account,
        uint256[] memory nftIds,
        uint256[] memory amounts
    ) private {
        require(
            nftIds.length == amounts.length,
            "ERC1155: ids and amounts length mismatch"
        );
        for (uint256 i = 0; i < nftIds.length; i++) {
            _pushMint(account, nftIds[i], amounts[i]);
        }
    }

    /** remember burn action (and refresh claimed) */
    function _pushBurn(address account, uint256 nftId, uint256 amount) private {
        require(
            amount > 0 && balanceOf(account, nftId) >= amount,
            "ERC1155: invalid amount or insufficient balance for transfer"
        );
        _mty.refreshClaimed(
            account,
            nftId,
            balanceOf(account, nftId),
            balanceOf(account, nftId) - amount
        );
        _age[account][nftId] -= Math.mulDiv(
            _age[account][nftId],
            amount,
            balanceOf(account, nftId)
        );
    }

    /** remember burn actions */
    function _pushBurnBatch(
        address account,
        uint256[] memory nftIds,
        uint256[] memory amounts
    ) private {
        require(
            nftIds.length == amounts.length,
            "ERC1155: ids and amounts length mismatch"
        );
        for (uint256 i = 0; i < nftIds.length; i++) {
            _pushBurn(account, nftIds[i], amounts[i]);
        }
    }

    /** remember mint action (incl. accumulators) */
    function _memoMint(address to, uint256 nftId, uint256 amount) private {
        _pushMint(to, nftId, amount);
        uint256 level = levelOf(nftId);
        _shares[level / 3] += int256(amount * 10 ** level);
    }

    /** remember mint actions (incl. accumulators) */
    function _memoMintBatch(
        address account,
        uint256[] memory nftIds,
        uint256[] memory amounts
    ) private {
        require(
            nftIds.length == amounts.length,
            "ERC1155: ids and amounts length mismatch"
        );
        for (uint256 i = 0; i < nftIds.length; i++) {
            _memoMint(account, nftIds[i], amounts[i]);
        }
    }

    /** remember burn action (incl. accumulators) */
    function _memoBurn(address account, uint256 nftId, uint256 amount) private {
        _pushBurn(account, nftId, amount);
        uint256 level = levelOf(nftId);
        _shares[level / 3] -= int256(amount * 10 ** level);
    }

    /** remember burn actions (incl. accumulators) */
    function _memoBurnBatch(
        address account,
        uint256[] memory nftIds,
        uint256[] memory amounts
    ) private {
        require(
            nftIds.length == amounts.length,
            "ERC1155: ids and amounts length mismatch"
        );
        for (uint256 i = 0; i < nftIds.length; i++) {
            _memoBurn(account, nftIds[i], amounts[i]);
        }
    }
}
