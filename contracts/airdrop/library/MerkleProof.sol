// SPDX-License-Identifier: MIT
// Minimal MerkleProof verifier (vendored, no external deps).
// OZ-style sorted-pair hashing: each pair of nodes is hashed after ordering the
// two by value, so proofs are direction-agnostic. This MUST match the merkle
// tree the off-chain builder produces (leaf ordering + sorted-pair hashing).

pragma solidity ^0.8.0;

/**
 * @title MerkleProof
 * @dev Verifies Merkle proofs against a known root. Port of the OpenZeppelin /
 * Uniswap merkle-distributor verifier used by MerkleDistributor.sol.
 */
library MerkleProof {
  /**
   * @dev Returns true if a `leaf` can be proved to be a part of a Merkle tree
   * defined by `root`. For this, a `proof` must be provided, containing sibling
   * hashes on the branch from the leaf to the root of the tree. Each pair of
   * leaves and each pair of pre-images are assumed to be sorted.
   */
  function verify(bytes32[] memory proof, bytes32 root, bytes32 leaf) internal pure returns (bool) {
    bytes32 computedHash = leaf;

    for (uint256 i = 0; i < proof.length; i++) {
      bytes32 proofElement = proof[i];

      if (computedHash <= proofElement) {
        // Hash(current computed hash + current element of the proof)
        computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
      } else {
        // Hash(current element of the proof + current computed hash)
        computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
      }
    }

    // Check if the computed hash (root) is equal to the provided root
    return computedHash == root;
  }
}
