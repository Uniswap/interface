// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { Script, console2 } from "../src/vendor/Script.sol";
import { HookSwapTokenFactory } from "../src/HookSwapTokenFactory.sol";

/**
 * Deploys the HookSwap token factory on the target chain with the configured
 * create fee + fee receiver. Mirrors ../../locker/script/DeployLockers.s.sol.
 *
 * Env vars:
 *   CREATE_FEE     — native-token fee to create a token, in wei (default: 0 = free)
 *   FEE_RECEIVER   — address that receives create fees (default: broadcaster)
 *
 * Run:
 *   CREATE_FEE=0 FEE_RECEIVER=0x... \
 *   forge script script/DeployTokenFactory.s.sol --rpc-url <rpc> --private-key <key> --broadcast
 */
contract DeployTokenFactory is Script {
  function run() external {
    uint256 createFee = vm.envOr("CREATE_FEE", uint256(0)); // free by default
    address feeReceiver = vm.envOr("FEE_RECEIVER", msg.sender);

    vm.startBroadcast();
    HookSwapTokenFactory factory = new HookSwapTokenFactory(feeReceiver, createFee);
    vm.stopBroadcast();

    console2.log("HookSwapTokenFactory", address(factory));
  }
}
