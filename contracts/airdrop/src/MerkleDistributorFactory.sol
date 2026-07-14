// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.24;

import { MerkleDistributor } from "./MerkleDistributor.sol";

/**
 * @title MerkleDistributorFactory
 * @notice Self-service factory for HookSwap merkle airdrops. Any project can
 * spin up a fresh `MerkleDistributor` (one token + one Merkle root) from the UI
 * in a single transaction, then fund it separately with a plain
 * `token.transfer(distributor, total)`.
 *
 * @dev Deploy this factory ONCE per chain (Reggie), record its address in
 * `contracts/deployments/robinhood-airdrop.json` under `merkleDistributorFactory`,
 * and let the frontend create per-airdrop distributors client-side. The factory
 * keeps an enumerable registry of every distributor it has created.
 */
contract MerkleDistributorFactory {
  /// @notice All distributors ever created by this factory, in creation order.
  address[] public distributors;

  /// @notice Emitted when a new distributor is created via `createDistributor`.
  event DistributorCreated(
    address indexed distributor,
    address indexed token,
    bytes32 merkleRoot,
    address indexed creator
  );

  /**
   * @notice Deploy a new `MerkleDistributor` for `token` committing to `merkleRoot`.
   * @param token The ERC-20 token to be airdropped.
   * @param merkleRoot Root of the (index, account, amount) Merkle tree.
   * @return distributor Address of the newly deployed distributor.
   */
  function createDistributor(
    address token,
    bytes32 merkleRoot
  ) external returns (address distributor) {
    distributor = address(new MerkleDistributor(token, merkleRoot));
    distributors.push(distributor);
    emit DistributorCreated(distributor, token, merkleRoot, msg.sender);
  }

  /// @notice Number of distributors created by this factory.
  function distributorsLength() external view returns (uint256) {
    return distributors.length;
  }

  /// @notice Full list of distributors created by this factory.
  function allDistributors() external view returns (address[] memory) {
    return distributors;
  }
}
