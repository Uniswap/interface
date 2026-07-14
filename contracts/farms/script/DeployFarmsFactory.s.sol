// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { StakingRewardsFactory } from "../src/StakingRewardsFactory.sol";

/**
 * Deploys the HookSwap {StakingRewardsFactory} on the target chain. Individual
 * farms are NOT deployed here — they are created client-side by anyone via
 * `factory.createAndFund(...)`.
 *
 * After deploy, record the factory address in
 * `contracts/deployments/robinhood-farms.json` → "stakingRewardsFactory".
 *
 * Run:
 *   forge script script/DeployFarmsFactory.s.sol \
 *     --rpc-url <rpc> --private-key <key> --broadcast
 */
contract DeployFarmsFactory is Script {
  function run() external {
    vm.startBroadcast();
    StakingRewardsFactory factory = new StakingRewardsFactory();
    vm.stopBroadcast();

    // Address is in the broadcast/ receipts; kept minimal (mirrors DeployLockers).
    _log("StakingRewardsFactory", address(factory));
  }

  function _log(string memory name, address addr) internal pure {
    name;
    addr;
  }
}
