// solhint-disable not-rely-on-time
// solhint-disable no-empty-blocks
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract XPower is ERC20, ERC20Burnable, Ownable {
    using EnumerableSet for EnumerableSet.UintSet;
    /** set of nonce-hashes already minted for */
    EnumerableSet.UintSet private _hashes;

    constructor() ERC20("XPower", "XPOW") {}

    /** @return number of decimal places of the token */
    function decimals() public view virtual override returns (uint8) {
        return 0;
    }

    /** mint tokens for nonce (and sender) */
    function mint(uint256 _nonce) public {
        // calculate nonce-hash of nonce for sender and interval
        bytes32 nonceHash = _hash(_nonce, msg.sender, interval());
        require(!_hashes.contains(uint256(nonceHash)), "duplicate nonce-hash");
        // calculate amount of tokens for nonce-hash
        uint256 amount = _amount(nonceHash);
        require(amount > 0, "empty nonce-hash");
        // ensure unique nonce-hash (to be used once)
        _hashes.add(uint256(nonceHash));
        // mint tokens for minter (i.e. nonce provider)
        _mint(msg.sender, amount);
        // mint tokens for owner (5.88% of total supply)
        _mint(owner(), amount / 2);
    }

    /** @return current interval (in hours) */
    function interval() public view returns (uint256) {
        return block.timestamp / (1 hours);
    }

    /** @return seconds left for current interval */
    function deadline() public view returns (uint256) {
        return block.timestamp % (1 hours);
    }

    /** @return hash of nonce for sender and interval */
    function _hash(
        uint256 _nonce,
        address _sender,
        uint256 _interval
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(_nonce, _sender, _interval));
    }

    /** @return 2 ** |leading-zeros(nonce-hash)| - 1 */
    function _amount(bytes32 _nonceHash) internal pure returns (uint256) {
        return 2**_zeros(_nonceHash) - 1;
    }

    /** @return leading zeros for nonce-hash */
    function _zeros(bytes32 _nonceHash) internal pure returns (uint8) {
        uint8 counter = 0;
        for (uint8 i = 0; i < 32; i++) {
            bytes1 b = _nonceHash[i];
            if (b == 0x00) {
                counter += 2;
                continue;
            }
            if (
                b == 0x01 ||
                b == 0x02 ||
                b == 0x03 ||
                b == 0x04 ||
                b == 0x05 ||
                b == 0x06 ||
                b == 0x07 ||
                b == 0x08 ||
                b == 0x09 ||
                b == 0x0a ||
                b == 0x0b ||
                b == 0x0c ||
                b == 0x0d ||
                b == 0x0e ||
                b == 0x0f
            ) {
                counter += 1;
                break;
            }
            break;
        }
        return counter;
    }
}
