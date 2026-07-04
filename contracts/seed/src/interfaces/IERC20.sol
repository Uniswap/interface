// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @dev Minimal ERC20 surface used by the seeder (balance / approve / transfer).
interface IERC20 {
    function decimals() external view returns (uint8);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @dev Minimal wrapped-native surface so the seeder can auto-wrap ETH -> WETH
///      when a pool side is the chain's WETH and the deployer's WETH balance is short.
interface IWETH is IERC20 {
    function deposit() external payable;
}
