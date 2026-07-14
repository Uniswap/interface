// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import { IERC20 } from "../library/IERC20.sol";
import { SafeERC20 } from "../library/SafeERC20.sol";
import { ReentrancyGuard } from "../library/ReentrancyGuard.sol";
import { Ownable } from "../library/Ownable.sol";

/**
 * @title StakingRewards
 *
 * HookSwap's self-service staking farm. A direct port of the canonical
 * Synthetix `StakingRewards.sol` (the reward-per-token-stored streaming staking
 * contract that underpins most DeFi "farm" UIs), ported from Solidity 0.5.x to
 * 0.8.24:
 *   - Removed the OpenZeppelin `SafeMath` library — 0.8.x has built-in checked
 *     arithmetic, so `.add/.sub/.mul/.div` become native `+ - * /`.
 *   - Replaced Synthetix's `Owned` + `RewardsDistributionRecipient` +
 *     `Pausable` mix-ins with the vendored {Ownable} (owner from constructor) and
 *     an inline `rewardsDistribution` gate. `Pausable` is dropped (not needed for
 *     the self-service factory model).
 *   - `IERC20` / `SafeERC20` / `ReentrancyGuard` are the vendored, self-contained
 *     copies under `../library` (no external OpenZeppelin import).
 *   - Explicit function visibility / `virtual`-`override` are 0.8-correct.
 *
 * The math (`rewardPerToken`, `earned`, the `updateReward` accumulator) is
 * byte-for-byte the audited Synthetix logic — only the arithmetic *syntax*
 * changed, not the formulas.
 *
 * `stakingToken` is any ERC-20: a plain token OR a HookSwap v2 LP-pair token
 * (which is itself an ERC-20) works unchanged, so this doubles as an LP farm.
 *
 * SECURITY: Not audited. The Synthetix original is battle-tested, but this port +
 * the factory wrapper need a fresh review before mainnet use with real value.
 */
contract StakingRewards is Ownable, ReentrancyGuard {
  using SafeERC20 for IERC20;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /// @dev Token paid out as rewards.
  IERC20 public immutable rewardsToken;

  /// @dev Token staked by users (plain ERC-20 or a v2 LP-pair token).
  IERC20 public immutable stakingToken;

  /// @dev Address authorized to fund the farm via {notifyRewardAmount}. For farms
  /// created by {StakingRewardsFactory} this is the factory; the owner can later
  /// reassign it with {setRewardsDistribution} to enable self top-ups.
  address public rewardsDistribution;

  /// @dev Timestamp at which the current reward period ends.
  uint256 public periodFinish;

  /// @dev Reward tokens streamed per second over the active period.
  uint256 public rewardRate;

  /// @dev Length of a reward period, in seconds (default 7 days).
  uint256 public rewardsDuration = 7 days;

  /// @dev Last time {updateReward} ran (clamped to periodFinish).
  uint256 public lastUpdateTime;

  /// @dev Accumulated reward-per-staked-token, scaled by 1e18.
  uint256 public rewardPerTokenStored;

  /// @dev Per-account snapshot of rewardPerTokenStored at last interaction.
  mapping(address => uint256) public userRewardPerTokenPaid;

  /// @dev Per-account pending (unclaimed) reward.
  mapping(address => uint256) public rewards;

  uint256 private _totalSupply;
  mapping(address => uint256) private _balances;

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  event RewardAdded(uint256 reward);
  event Staked(address indexed user, uint256 amount);
  event Withdrawn(address indexed user, uint256 amount);
  event RewardPaid(address indexed user, uint256 reward);
  event RewardsDurationUpdated(uint256 newDuration);
  event RewardsDistributionUpdated(address indexed newRewardsDistribution);
  event Recovered(address indexed token, uint256 amount);

  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------

  /**
   * @param owner_ Owner (admin) of this farm — controls duration / recovery.
   * @param rewardsDistribution_ Address allowed to call {notifyRewardAmount}.
   * @param rewardsToken_ ERC-20 paid out as rewards.
   * @param stakingToken_ ERC-20 users stake (may be a v2 LP token).
   */
  constructor(
    address owner_,
    address rewardsDistribution_,
    address rewardsToken_,
    address stakingToken_
  ) Ownable(owner_) {
    require(rewardsToken_ != address(0), "StakingRewards: rewardsToken zero");
    require(stakingToken_ != address(0), "StakingRewards: stakingToken zero");

    rewardsToken = IERC20(rewardsToken_);
    stakingToken = IERC20(stakingToken_);
    rewardsDistribution = rewardsDistribution_;
    emit RewardsDistributionUpdated(rewardsDistribution_);
  }

  // ---------------------------------------------------------------------------
  // Views
  // ---------------------------------------------------------------------------

  function totalSupply() external view returns (uint256) {
    return _totalSupply;
  }

  function balanceOf(address account) external view returns (uint256) {
    return _balances[account];
  }

  /// @notice Last timestamp rewards are applicable to (min of now, periodFinish).
  function lastTimeRewardApplicable() public view returns (uint256) {
    return block.timestamp < periodFinish ? block.timestamp : periodFinish;
  }

  /// @notice Current accumulated reward-per-staked-token (scaled 1e18).
  function rewardPerToken() public view returns (uint256) {
    if (_totalSupply == 0) {
      return rewardPerTokenStored;
    }
    return
      rewardPerTokenStored +
      ((lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * 1e18) / _totalSupply;
  }

  /// @notice Reward `account` has earned but not yet claimed.
  function earned(address account) public view returns (uint256) {
    return
      (_balances[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) /
      1e18 +
      rewards[account];
  }

  /// @notice Total reward that will be paid over the full current duration.
  function getRewardForDuration() external view returns (uint256) {
    return rewardRate * rewardsDuration;
  }

  // ---------------------------------------------------------------------------
  // Mutative (users)
  // ---------------------------------------------------------------------------

  /// @notice Stake `amount` of the staking token.
  function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
    require(amount > 0, "StakingRewards: cannot stake 0");
    _totalSupply += amount;
    _balances[msg.sender] += amount;
    stakingToken.safeTransferFrom(msg.sender, address(this), amount);
    emit Staked(msg.sender, amount);
  }

  /// @notice Withdraw `amount` of previously staked tokens.
  function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender) {
    require(amount > 0, "StakingRewards: cannot withdraw 0");
    _totalSupply -= amount;
    _balances[msg.sender] -= amount;
    stakingToken.safeTransfer(msg.sender, amount);
    emit Withdrawn(msg.sender, amount);
  }

  /// @notice Claim all pending rewards.
  function getReward() public nonReentrant updateReward(msg.sender) {
    uint256 reward = rewards[msg.sender];
    if (reward > 0) {
      rewards[msg.sender] = 0;
      rewardsToken.safeTransfer(msg.sender, reward);
      emit RewardPaid(msg.sender, reward);
    }
  }

  /// @notice Withdraw the full stake and claim rewards in one call.
  function exit() external {
    withdraw(_balances[msg.sender]);
    getReward();
  }

  // ---------------------------------------------------------------------------
  // Restricted
  // ---------------------------------------------------------------------------

  /**
   * @notice Fund the farm with `reward` tokens and (re)start / extend the stream.
   * @dev The reward tokens must already sit in this contract (the factory transfers
   * them in before calling this). Gated to `rewardsDistribution`.
   */
  function notifyRewardAmount(uint256 reward)
    external
    onlyRewardsDistribution
    updateReward(address(0))
  {
    if (block.timestamp >= periodFinish) {
      rewardRate = reward / rewardsDuration;
    } else {
      uint256 remaining = periodFinish - block.timestamp;
      uint256 leftover = remaining * rewardRate;
      rewardRate = (reward + leftover) / rewardsDuration;
    }

    // Sanity: the stream can't pay out more than the contract actually holds.
    uint256 balance = rewardsToken.balanceOf(address(this));
    require(rewardRate <= balance / rewardsDuration, "StakingRewards: reward too high");

    lastUpdateTime = block.timestamp;
    periodFinish = block.timestamp + rewardsDuration;
    emit RewardAdded(reward);
  }

  /**
   * @notice Set the reward period length. Only allowed while no period is active.
   * @dev Callable by the owner OR the current `rewardsDistribution` — the factory
   * (rewardsDistribution) sets it at creation, the owner can change it later once
   * a period has finished.
   */
  function setRewardsDuration(uint256 _rewardsDuration) external onlyOwnerOrRewardsDistribution {
    require(block.timestamp > periodFinish, "StakingRewards: reward period active");
    require(_rewardsDuration > 0, "StakingRewards: zero duration");
    rewardsDuration = _rewardsDuration;
    emit RewardsDurationUpdated(_rewardsDuration);
  }

  /// @notice Reassign the reward funder (e.g. from the factory to the owner for top-ups).
  function setRewardsDistribution(address _rewardsDistribution) external onlyOwner {
    rewardsDistribution = _rewardsDistribution;
    emit RewardsDistributionUpdated(_rewardsDistribution);
  }

  /**
   * @notice Recover an ERC-20 accidentally sent to this contract. Owner only.
   * @dev Cannot pull the staking token (that would let the admin seize user stakes).
   */
  function recoverERC20(address tokenAddress, uint256 tokenAmount) external onlyOwner {
    require(tokenAddress != address(stakingToken), "StakingRewards: cannot withdraw staking token");
    IERC20(tokenAddress).safeTransfer(_owner(), tokenAmount);
    emit Recovered(tokenAddress, tokenAmount);
  }

  // ---------------------------------------------------------------------------
  // Modifiers
  // ---------------------------------------------------------------------------

  /// @dev Snapshot the reward accumulator before any balance-changing action.
  modifier updateReward(address account) {
    rewardPerTokenStored = rewardPerToken();
    lastUpdateTime = lastTimeRewardApplicable();
    if (account != address(0)) {
      rewards[account] = earned(account);
      userRewardPerTokenPaid[account] = rewardPerTokenStored;
    }
    _;
  }

  modifier onlyRewardsDistribution() {
    require(msg.sender == rewardsDistribution, "StakingRewards: not rewardsDistribution");
    _;
  }

  modifier onlyOwnerOrRewardsDistribution() {
    require(
      msg.sender == _owner() || msg.sender == rewardsDistribution,
      "StakingRewards: not owner/distribution"
    );
    _;
  }
}
