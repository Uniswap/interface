// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { HookSwapTokenLockerManager } from "../HookSwapTokenLockerManager.sol";
import { HookSwapV3PositionLocker } from "../HookSwapV3PositionLocker.sol";

/**
 * Deploys the HookSwap locker suite on the target chain with the configured lock
 * fee. `forge script` auto-deploys + links the `Util` library, so no manual
 * library linking is needed.
 *
 * Env vars:
 *   LOCK_FEE       — lock fee in wei (e.g. 40000000000000000 = 0.04 native)
 *   FEE_RECEIVER   — address that receives lock fees (default: broadcaster)
 *
 * Run:
 *   LOCK_FEE=40000000000000000 FEE_RECEIVER=0x... \
 *   forge script script/DeployLockers.s.sol --rpc-url <rpc> --private-key <key> --broadcast
 */
contract DeployLockers is Script {
  function run() external {
    uint256 lockFee = vm.envOr("LOCK_FEE", uint256(40000000000000000)); // 0.04 default
    address feeReceiver = vm.envOr("FEE_RECEIVER", msg.sender);

    vm.startBroadcast();
    HookSwapTokenLockerManager manager = new HookSwapTokenLockerManager(lockFee, feeReceiver);
    HookSwapV3PositionLocker v3Locker = new HookSwapV3PositionLocker(lockFee, feeReceiver);
    vm.stopBroadcast();

    // forge prints these; also emit for logs.
    // solhint-disable-next-line no-console
    _log("HookSwapTokenLockerManager", address(manager));
    _log("HookSwapV3PositionLocker", address(v3Locker));
  }

  function _log(string memory name, address addr) internal pure {
    // no-op helper kept minimal; addresses are in the broadcast/ receipts.
    name;
    addr;
  }
}
