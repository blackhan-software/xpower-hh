// SPDX-License-Identifier: GPL-3.0
// solhint-disable no-empty-blocks
pragma solidity ^0.8.0;

import "./APower.sol";

contract APowerThorTest is APowerThor {
    constructor(
        address moeLink,
        address[] memory sovBase,
        uint256 deadlineIn
    ) APowerThor(moeLink, sovBase, deadlineIn) {}
}

contract APowerThorOldTest is APowerThorTest {
    constructor(
        address moeLink,
        address[] memory sovBase,
        uint256 deadlineIn
    ) APowerThorTest(moeLink, sovBase, deadlineIn) {}

    function decimals() public pure override returns (uint8) {
        return 0;
    }
}

contract APowerLokiTest is APowerLoki {
    constructor(
        address moeLink,
        address[] memory sovBase,
        uint256 deadlineIn
    ) APowerLoki(moeLink, sovBase, deadlineIn) {}
}

contract APowerLokiOldTest is APowerLokiTest {
    constructor(
        address moeLink,
        address[] memory sovBase,
        uint256 deadlineIn
    ) APowerLokiTest(moeLink, sovBase, deadlineIn) {}

    function decimals() public pure override returns (uint8) {
        return 0;
    }
}

contract APowerOdinTest is APowerOdin {
    constructor(
        address moeLink,
        address[] memory sovBase,
        uint256 deadlineIn
    ) APowerOdin(moeLink, sovBase, deadlineIn) {}
}

contract APowerOdinOldTest is APowerOdinTest {
    constructor(
        address moeLink,
        address[] memory sovBase,
        uint256 deadlineIn
    ) APowerOdinTest(moeLink, sovBase, deadlineIn) {}

    function decimals() public pure override returns (uint8) {
        return 0;
    }
}
