// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
import "../libraries/boring-solidity/BoringERC20.sol";
interface IRewarder {
    using BoringERC20 for ForBoringUseIERC20;
    function onSushiReward(uint256 pid, address user, address recipient, uint256 sushiAmount, uint256 newLpAmount) external;
    function pendingTokens(uint256 pid, address user, uint256 sushiAmount) external view returns (ForBoringUseIERC20[] memory, uint256[] memory);
}
