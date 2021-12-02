// solhint-disable no-empty-blocks
<<<<<<< HEAD
// SPDX-License-Identifier: GPL-3.0
=======
// SPDX-License-Identifier: MIT
>>>>>>> 54e16f3 (XPower NFTs: 2021)
pragma solidity ^0.8.0;
import "./XPowerNft.sol";

contract XPowerNftTest is XPowerNft {
    constructor(
        string memory uri,
        address xpower,
        address base
    ) XPowerNft(uri, xpower, base) {}
}

contract XPowerCpuNftTest is XPowerNftTest {
    constructor(
        string memory uri,
        address xpower,
        address base
    ) XPowerNftTest(uri, xpower, base) {}
}

contract XPowerGpuNftTest is XPowerNftTest {
    constructor(
        string memory uri,
        address xpower,
        address base
    ) XPowerNftTest(uri, xpower, base) {}
}

contract XPowerAsicNftTest is XPowerNftTest {
    constructor(
        string memory uri,
        address xpower,
        address base
    ) XPowerNftTest(uri, xpower, base) {}
}
