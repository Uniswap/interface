// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

/// @dev Minimal Uniswap V2 factory surface used by the seeder.
interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function createPair(address tokenA, address tokenB) external returns (address pair);
}
