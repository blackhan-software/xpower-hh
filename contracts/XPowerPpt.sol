// SPDX-License-Identifier: GPL-3.0
// solhint-disable no-empty-blocks
// solhint-disable not-rely-on-time
pragma solidity ^0.8.0;

import {NftBase} from "./base/NftBase.sol";

/**
 * Abstract base class for staked XPowerNft(s): Only the contract owner i.e.
 * the NftTreasury is allowed to mint and burn XPowerPpt tokens.
 */
contract XPowerPpt is NftBase {
    /** map of ages: account => nft-id => accumulator [seconds] */
    mapping(address => mapping(uint256 => int256)) private _age;
    /** map of total ages: nft-id => accumulator [seconds] */
    mapping(uint256 => int256) private _ageTotal;

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

    /** mint particular amount of staked NFTs (for address and nft-id) */
    function mint(address to, uint256 nftId, uint256 amount) public onlyOwner {
        _pushMint(to, nftId, amount);
        _mint(to, nftId, amount, "");
    }

    /** mint particular amounts of staked NFTs (for address and nft-ids) */
    function mintBatch(address to, uint256[] memory nftIds, uint256[] memory amounts) public onlyOwner {
        _pushMintBatch(to, nftIds, amounts);
        _mintBatch(to, nftIds, amounts, "");
    }

    /** burn particular amount of staked NFTs (for address and nft-id) */
    function burn(address from, uint256 nftId, uint256 amount) public override onlyOwner {
        _pushBurn(from, nftId, amount);
        _burn(from, nftId, amount);
    }

    /** burn particular amounts of staked NFTs (for address and nft-ids) */
    function burnBatch(address from, uint256[] memory nftIds, uint256[] memory amounts) public override onlyOwner {
        _pushBurnBatch(from, nftIds, amounts);
        _burnBatch(from, nftIds, amounts);
    }

    /** @return age seconds over all stakes (for address and nft-id) */
    function ageOf(address account, uint256 nftId) public view returns (uint256) {
        int256 age = _age[account][nftId];
        if (age > 0) {
            uint256 balance = balanceOf(account, nftId);
            return balance * block.timestamp - uint256(age);
        }
        return 0;
    }

    /** @return age seconds totalled over all stakes (for nft-id) */
    function totalAgeOf(uint256 nftId) public view returns (uint256) {
        int256 age = _ageTotal[nftId];
        if (age > 0) {
            uint256 supply = totalSupply(nftId);
            return supply * block.timestamp - uint256(age);
        }
        return 0;
    }

    /** remember mint action */
    function _pushMint(address account, uint256 nftId, uint256 amount) internal {
        require(amount > 0, "non-positive amount");
        int256 delta = int256(amount * block.timestamp);
        _age[account][nftId] += delta;
        _ageTotal[nftId] += delta;
    }

    /** remember mint actions */
    function _pushMintBatch(address account, uint256[] memory nftIds, uint256[] memory amounts) internal {
        assert(nftIds.length <= amounts.length);
        for (uint256 i = 0; i < nftIds.length; i++) {
            _pushMint(account, nftIds[i], amounts[i]);
        }
    }

    /** remember burn action */
    function _pushBurn(address account, uint256 nftId, uint256 amount) internal {
        require(amount > 0, "non-positive amount");
        int256 delta = int256(amount * block.timestamp);
        _age[account][nftId] -= delta;
        _ageTotal[nftId] -= delta;
    }

    /** remember burn actions */
    function _pushBurnBatch(address account, uint256[] memory nftIds, uint256[] memory amounts) internal {
        assert(nftIds.length <= amounts.length);
        for (uint256 i = 0; i < nftIds.length; i++) {
            _pushBurn(account, nftIds[i], amounts[i]);
        }
    }
}
