// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { MerkleDistributorFactory } from "../src/MerkleDistributorFactory.sol";

/**
 * Deploys the HookSwap merkle-airdrop factory on the target chain. Deploy this
 * ONCE per chain; per-airdrop distributors are then created client-side via
 * `MerkleDistributorFactory.createDistributor(token, merkleRoot)`.
 *
 * After deploy, record the factory address in
 * `contracts/deployments/robinhood-airdrop.json` under `merkleDistributorFactory`.
 *
 * Run:
 *   forge script script/DeployAirdropFactory.s.sol --rpc-url <rpc> --private-key <key> --broadcast
 */
contract DeployAirdropFactory is Script {
  function run() external {
    vm.startBroadcast();
    MerkleDistributorFactory factory = new MerkleDistributorFactory();
    vm.stopBroadcast();

    // Address is in the broadcast/ receipts; kept minimal like DeployLockers.
    factory;
  }
}
