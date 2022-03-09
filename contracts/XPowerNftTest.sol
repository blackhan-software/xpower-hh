// solhint-disable no-empty-blocks
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;
import "./XPowerNft.sol";

contract XPowerNftTest is XPowerNft {
    constructor(
        string memory uri,
        address xpower,
        address base
    ) XPowerNft(uri, xpower, base) {}
}

contract XPowerParaNftTest is XPowerNftTest {
    constructor(
        string memory uri,
        address xpower,
        address base
    ) XPowerNftTest(uri, xpower, base) {}
}

contract XPowerAqchNftTest is XPowerNftTest {
    constructor(
        string memory uri,
        address xpower,
        address base
    ) XPowerNftTest(uri, xpower, base) {}
}

contract XPowerQrshNftTest is XPowerNftTest {
    constructor(
        string memory uri,
        address xpower,
        address base
    ) XPowerNftTest(uri, xpower, base) {}
}
