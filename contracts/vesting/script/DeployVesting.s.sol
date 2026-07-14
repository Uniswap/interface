// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { HookSwapVestingManager } from "../src/HookSwapVestingManager.sol";

/**
 * Deploys the HookSwap vesting manager on the target chain with the configured
 * vesting fee. Mirrors `contracts/locker/script/DeployLockers.s.sol`.
 *
 * Env vars:
 *   VESTING_FEE    — vesting creation fee in wei (default: 0 = free)
 *   FEE_RECEIVER   — address that receives vesting fees (default: broadcaster)
 *
 * Run:
 *   VESTING_FEE=0 FEE_RECEIVER=0x... \
 *   forge script script/DeployVesting.s.sol --rpc-url <rpc> --private-key <key> --broadcast
 */
contract DeployVesting is Script {
  function run() external {
    uint256 vestingFee = vm.envOr("VESTING_FEE", uint256(0)); // free by default
    address feeReceiver = vm.envOr("FEE_RECEIVER", msg.sender);

    vm.startBroadcast();
    HookSwapVestingManager manager = new HookSwapVestingManager(vestingFee, feeReceiver);
    vm.stopBroadcast();

    // forge prints these; also emit for logs.
    _log("HookSwapVestingManager", address(manager));
  }

  function _log(string memory name, address addr) internal pure {
    // no-op helper kept minimal; addresses are in the broadcast/ receipts.
    name;
    addr;
  }
}
