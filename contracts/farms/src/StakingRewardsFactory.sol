// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import { IERC20 } from "../library/IERC20.sol";
import { SafeERC20 } from "../library/SafeERC20.sol";
import { StakingRewards } from "./StakingRewards.sol";

/**
 * @title StakingRewardsFactory
 *
 * Self-service deployer for HookSwap {StakingRewards} farms. Anyone can spin up a
 * fully-funded farm in a single transaction: the factory deploys a fresh
 * {StakingRewards}, pulls the reward budget from the creator (who pre-approves the
 * factory), funds the farm, and starts the reward stream.
 *
 * Trust model per farm:
 *   - `owner`               = the creator (`msg.sender`) — controls duration /
 *     recovery / reassigning distribution.
 *   - `rewardsDistribution` = this factory — the only caller able to run the
 *     initial {StakingRewards.notifyRewardAmount}. The owner may later take over
 *     distribution via {StakingRewards.setRewardsDistribution} for top-ups.
 *
 * SECURITY: Not audited. See StakingRewards.sol.
 */
contract StakingRewardsFactory {
  using SafeERC20 for IERC20;

  /// @dev Every farm ever created by this factory, in creation order.
  address[] private _farms;

  event FarmCreated(
    address indexed farm,
    address indexed stakingToken,
    address indexed rewardToken
  );

  /**
   * @notice Deploy a new farm and fund it in one call.
   *
   * The caller MUST have approved this factory to spend at least `rewardAmount` of
   * `rewardToken` beforehand. The factory pulls the reward straight into the new
   * farm, sets the reward duration, and starts the stream.
   *
   * @param stakingToken ERC-20 users will stake (plain token or a v2 LP token).
   * @param rewardToken  ERC-20 paid out as rewards.
   * @param rewardAmount Total reward budget streamed over `duration`.
   * @param duration     Reward period length, in seconds (must be > 0).
   * @return farm        Address of the newly deployed {StakingRewards}.
   */
  function createAndFund(
    address stakingToken,
    address rewardToken,
    uint256 rewardAmount,
    uint256 duration
  ) external returns (address farm) {
    require(stakingToken != address(0), "Factory: stakingToken zero");
    require(rewardToken != address(0), "Factory: rewardToken zero");
    require(stakingToken != rewardToken, "StakingRewardsFactory: staking==reward");
    require(rewardAmount > 0, "Factory: rewardAmount zero");
    require(duration > 0, "Factory: duration zero");

    // owner = creator; rewardsDistribution = this factory (so we can notify below).
    StakingRewards newFarm = new StakingRewards(
      msg.sender,
      address(this),
      rewardToken,
      stakingToken
    );
    farm = address(newFarm);

    // Pull the reward budget from the creator directly into the farm, so the
    // farm holds the funds before notifyRewardAmount's balance check runs.
    IERC20(rewardToken).safeTransferFrom(msg.sender, farm, rewardAmount);

    // Configure + start the stream (factory is rewardsDistribution → authorized).
    newFarm.setRewardsDuration(duration);
    newFarm.notifyRewardAmount(rewardAmount);

    _farms.push(farm);
    emit FarmCreated(farm, stakingToken, rewardToken);
  }

  /// @notice All farms created by this factory.
  function allFarms() external view returns (address[] memory) {
    return _farms;
  }

  /// @notice Number of farms created by this factory.
  function farmsLength() external view returns (uint256) {
    return _farms.length;
  }

  /// @notice Farm at `index` in creation order.
  function farmAt(uint256 index) external view returns (address) {
    require(index < _farms.length, "Factory: index out of range");
    return _farms[index];
  }
}
