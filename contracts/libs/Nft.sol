// SPDX-License-Identifier: GPL-3.0
// solhint-disable not-rely-on-time
pragma solidity ^0.8.0;

import {Constants} from "./Constants.sol";

library Nft {
    /** @return nft-id composed of (year, level, prefix) */
    function idBy(uint256 anno, uint256 level, uint256 prefix) internal pure returns (uint256) {
        require(level % 3 == 0, "non-ternary level");
        require(level < 100, "invalid level");
        require(anno > 2020, "invalid year");
        return eonOf(anno) * prefix + 100 * anno + level;
    }

    /** @return nft-ids composed of [(year, level, prefix) for level in levels] */
    function idsBy(uint256 anno, uint256[] memory levels, uint256 prefix) internal pure returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](levels.length);
        for (uint256 i = 0; i < levels.length; i++) {
            ids[i] = idBy(anno, levels[i], prefix);
        }
        return ids;
    }

    /** @return denomination of level (1, 1'000, 1'000'000, ...) */
    function denominationOf(uint256 level) internal pure returns (uint256) {
        require(level % 3 == 0, "non-ternary level");
        require(level < 100, "invalid level");
        return 10 ** level;
    }

    /** @return level of nft-id (0, 3, 6, ...) */
    function levelOf(uint256 nftId) internal pure returns (uint256) {
        uint256 level = nftId % 100;
        require(level % 3 == 0, "non-ternary level");
        require(level < 100, "invalid level");
        return level;
    }

    /** @return prefix of nft-id (1, 2, 3, ...) */
    function prefixOf(uint256 nftId) internal pure returns (uint256) {
        uint256 prefix = nftId / eonOf(yearOf(nftId));
        require(prefix > 0, "invalid prefix");
        return prefix;
    }

    /** @return year of nft-id (2021, 2022, ...) */
    function yearOf(uint256 nftId) internal pure returns (uint256) {
        uint256 anno = (nftId / 100) % 10_000;
        require(anno > 2020, "invalid year");
        return anno;
    }

    /** @return current number of years since anno domini */
    function year() internal view returns (uint256) {
        uint256 anno = 1970 + (100 * block.timestamp) / Constants.CENTURY;
        require(anno > 2020, "invalid year");
        return anno;
    }

    /** @return eon the given year belongs to: 1M, 10M, 100M, ... */
    function eonOf(uint256 anno) internal pure returns (uint256) {
        uint256 eon = 10_000;
        while (anno / eon > 0) {
            eon *= 10;
        }
        return 100 * eon;
    }
}
