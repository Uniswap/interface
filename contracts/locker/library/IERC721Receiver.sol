// SPDX-License-Identifier: MIT
// Minimal ERC-721 receiver interface (self-contained, no external deps).

pragma solidity ^0.8.0;

/**
 * @dev Interface that must be implemented by smart contracts wishing to accept
 * safe transfers of ERC-721 tokens.
 */
interface IERC721Receiver {
  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external returns (bytes4);
}
