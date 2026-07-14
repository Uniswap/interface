// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { Disperse } from "../src/Disperse.sol";

/**
 * Deploys the stateless HookSwap {Disperse} multisender on the target chain. No
 * constructor args — Disperse has no owner, no fees, and no configuration.
 *
 * Run:
 *   forge script script/DeployMultisender.s.sol --rpc-url <rpc> --private-key <key> --broadcast
 *
 * After deploy: record the address in `contracts/deployments/robinhood.json` (as
 * `"disperse"`) or a sidecar `contracts/deployments/robinhood-multisender.json`, then
 * fill it into `apps/web/src/terminal/multisender/addresses.ts`.
 */
contract DeployMultisender is Script {
  function run() external {
    vm.startBroadcast();
    Disperse disperse = new Disperse();
    vm.stopBroadcast();

    // Address is in the broadcast/ receipts; reference the var so it isn't optimised out.
    disperse;
  }
}
