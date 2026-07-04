// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ---------------------------------------------------------------------------
// Minimal, self-contained forge scripting shim.
//
// This kit deliberately does NOT depend on a `lib/forge-std` checkout — the
// deploy kit next door has none, disk is tight, and pulling a submodule in via
// an absolute path is fragile. Instead we vendor only the cheatcodes the seeder
// actually uses. If you'd rather use the real forge-std (it lives in
// ../../../forks/universal-router/lib/forge-std), add a remapping in
// foundry.toml and swap the import in SeedPools.s.sol — the API used here is a
// strict subset of forge-std's Vm.
// ---------------------------------------------------------------------------

/// @dev Subset of the Foundry cheatcode interface used by the seeder.
interface Vm {
    // --- environment ---
    function envString(string calldata name) external view returns (string memory);
    function envUint(string calldata name) external view returns (uint256);
    function envOr(string calldata name, uint256 defaultValue) external view returns (uint256);
    function envOr(string calldata name, string calldata defaultValue) external view returns (string memory);

    // --- filesystem / json ---
    function readFile(string calldata path) external view returns (string memory);
    function parseJsonAddress(string calldata json, string calldata key) external pure returns (address);

    // --- parsing ---
    function parseAddress(string calldata value) external pure returns (address);

    // --- string helpers ---
    function toString(address value) external pure returns (string memory);
    function toString(uint256 value) external pure returns (string memory);

    // --- broadcasting ---
    function startBroadcast() external;
    function stopBroadcast() external;
}

/// @dev Minimal console.log shim (payload-compatible with forge's console).
library console2 {
    address constant CONSOLE_ADDRESS = 0x000000000000000000636F6e736F6c652e6c6f67;

    function _send(bytes memory payload) private view {
        address console = CONSOLE_ADDRESS;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            pop(staticcall(gas(), console, add(payload, 0x20), mload(payload), 0x00, 0x00))
        }
    }

    function log(string memory p0) internal view {
        _send(abi.encodeWithSignature("log(string)", p0));
    }

    function log(string memory p0, string memory p1) internal view {
        _send(abi.encodeWithSignature("log(string,string)", p0, p1));
    }

    function log(string memory p0, uint256 p1) internal view {
        _send(abi.encodeWithSignature("log(string,uint256)", p0, p1));
    }

    function log(string memory p0, address p1) internal view {
        _send(abi.encodeWithSignature("log(string,address)", p0, p1));
    }

    function log(string memory p0, int256 p1) internal view {
        _send(abi.encodeWithSignature("log(string,int256)", p0, p1));
    }
}

/// @dev Minimal Script base: exposes the vm cheatcode singleton.
abstract contract Script {
    Vm internal constant vm = Vm(0x7109709ECfa91a80626fF3989D68f67F5b1DD12D);
    bool public constant IS_SCRIPT = true;
}
