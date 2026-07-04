// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

/// @dev Minimal Uniswap V3 factory surface used by the seeder.
interface IUniswapV3Factory {
    /// @notice Returns the pool address for a (tokenA, tokenB, fee) tuple, or address(0) if none.
    function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool);

    /// @notice tickSpacing enabled for a given fee amount (0 if the fee tier is disabled).
    function feeAmountTickSpacing(uint24 fee) external view returns (int24);
}
