// SPDX-License-Identifier: GPL-3.0
// solhint-disable no-empty-blocks
pragma solidity ^0.8.0;

import {PaymentSplitter} from "@openzeppelin/contracts/finance/PaymentSplitter.sol";

/**
 * Splits benefits of XPower's co-minting among a set of payees.
 */
contract MoeSplitter is PaymentSplitter {
    constructor(
        address[] memory payees,
        uint256[] memory shares
    ) PaymentSplitter(payees, shares) {}
}
