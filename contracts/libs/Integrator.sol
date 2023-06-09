// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

/**
 * Allows to integrate over an array of (stamp, value) tuples, and to take
 * the duration i.e. Δ-stamp weighted arithmetic mean of those values.
 */
library Integrator {
    struct Item {
        /** stamp of value */
        uint256 stamp;
        /** value of interest */
        uint256 value;
        /** cumulative sum over Δ-stamps × values */
        uint256 area;
        /** meta of value */
        bytes meta;
    }

    /** @return head item */
    function headOf(Item[] storage items) internal view returns (Item memory) {
        return items.length > 0 ? items[0] : Item(0, 0, 0, "");
    }

    /** @return last item */
    function lastOf(Item[] storage items) internal view returns (Item memory) {
        return items.length > 0 ? items[items.length - 1] : Item(0, 0, 0, "");
    }

    /** @return next item (for stamp, value & and) */
    function _nextOf(
        Item[] storage items,
        uint256 stamp,
        uint256 value,
        bytes memory meta
    ) private view returns (Item memory) {
        if (items.length > 0) {
            Item memory last = items[items.length - 1];
            require(stamp >= last.stamp, "invalid stamp");
            uint256 area = value * (stamp - last.stamp);
            return Item(stamp, value, last.area + area, meta);
        }
        return Item(stamp, value, 0, meta);
    }

    /** @return Δ-stamp weighted arithmetic mean of values (incl. next stamp & value) */
    function meanOf(Item[] storage items, uint256 stamp, uint256 value) internal view returns (uint256) {
        uint256 area = areaOf(items, stamp, value);
        Item memory head = headOf(items);
        if (stamp > head.stamp) {
            return area / (stamp - head.stamp);
        }
        return head.value;
    }

    /** @return area of Δ-stamps × values (incl. next stamp and value) */
    function areaOf(Item[] storage items, uint256 stamp, uint256 value) internal view returns (uint256) {
        return _nextOf(items, stamp, value, "").area;
    }

    /** append (stamp, value, meta) to items (with stamp >= last?.stamp) */
    function append(Item[] storage items, uint256 stamp, uint256 value, bytes memory meta) internal {
        items.push(_nextOf(items, stamp, value, meta));
    }

    /** append (stamp, value) to items (with stamp >= last?.stamp) */
    function append(Item[] storage items, uint256 stamp, uint256 value) internal {
        append(items, stamp, value, "");
    }
}
