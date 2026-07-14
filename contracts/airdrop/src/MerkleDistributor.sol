// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.24;

import { IERC20 } from "../library/IERC20.sol";
import { SafeERC20 } from "../library/SafeERC20.sol";
import { MerkleProof } from "../library/MerkleProof.sol";

/**
 * @title MerkleDistributor
 * @notice Gas-efficient, self-service airdrop distributor for HookSwap. Fork of
 * Uniswap's `MerkleDistributor` (Uniswap/merkle-distributor), ported from
 * solc 0.6.x to 0.8.24 (SafeMath removed — 0.8.x has built-in overflow checks;
 * MerkleProof + claim bitmap logic preserved unchanged).
 *
 * @dev A single distributor holds one `token` and one immutable `merkleRoot`.
 * Only claimers pay gas: the deployer/creator funds the contract by transferring
 * the total airdrop amount to it (a plain `token.transfer`, done separately after
 * creation), then each recipient calls `claim` with their Merkle proof.
 *
 * LEAF FORMAT (must match the off-chain merkle builder EXACTLY):
 *   leaf = keccak256(abi.encodePacked(uint256 index, address account, uint256 amount))
 * with OZ-style sorted-pair hashing for the internal nodes (see MerkleProof.sol).
 */
contract MerkleDistributor {
  using SafeERC20 for IERC20;

  /// @notice The ERC-20 token being distributed.
  address public immutable token;
  /// @notice The Merkle root committing to the full (index, account, amount) set.
  bytes32 public immutable merkleRoot;

  // Packed array of booleans tracking which indices have been claimed.
  mapping(uint256 => uint256) private claimedBitMap;

  /// @notice Emitted when `account` successfully claims `amount` at `index`.
  event Claimed(uint256 index, address account, uint256 amount);

  constructor(address token_, bytes32 merkleRoot_) {
    token = token_;
    merkleRoot = merkleRoot_;
  }

  /// @notice Returns true if the airdrop at `index` has already been claimed.
  function isClaimed(uint256 index) public view returns (bool) {
    uint256 claimedWordIndex = index / 256;
    uint256 claimedBitIndex = index % 256;
    uint256 claimedWord = claimedBitMap[claimedWordIndex];
    uint256 mask = (1 << claimedBitIndex);
    return claimedWord & mask == mask;
  }

  function _setClaimed(uint256 index) private {
    uint256 claimedWordIndex = index / 256;
    uint256 claimedBitIndex = index % 256;
    claimedBitMap[claimedWordIndex] = claimedBitMap[claimedWordIndex] | (1 << claimedBitIndex);
  }

  /**
   * @notice Claim `amount` of `token` for `account`, proving membership at `index`.
   * @dev Reverts if already claimed or if the Merkle proof is invalid.
   */
  function claim(
    uint256 index,
    address account,
    uint256 amount,
    bytes32[] calldata merkleProof
  ) external {
    require(!isClaimed(index), "MerkleDistributor: Drop already claimed.");

    // Verify the Merkle proof.
    bytes32 node = keccak256(abi.encodePacked(index, account, amount));
    require(MerkleProof.verify(merkleProof, merkleRoot, node), "MerkleDistributor: Invalid proof.");

    // Mark it claimed and send the token.
    _setClaimed(index);
    IERC20(token).safeTransfer(account, amount);

    emit Claimed(index, account, amount);
  }
}
