// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import { IERC20 } from "../library/IERC20.sol";
import { SafeERC20 } from "../library/SafeERC20.sol";
import { ReentrancyGuard } from "../library/ReentrancyGuard.sol";

/**
 * @title HookSwapVesting
 *
 * Per-schedule child contract that custodies a single ERC-20 token balance and
 * releases it to a fixed beneficiary on a cliff + linear vesting curve. Created
 * and funded by `HookSwapVestingManager` (one child per schedule), isomorphic to
 * the per-lock `HookSwapTokenLocker` child in `contracts/locker/`.
 *
 * The release curve is the OpenZeppelin `VestingWallet` / `VestingWalletCliff`
 * schedule, computed in RAW token units (no rounding tricks):
 *   - 0 before `start + cliff`
 *   - `total * (t - start) / duration` between cliff and `start + duration`
 *   - `total` (fully vested) at/after `start + duration`
 *
 * Phase 1 is NON-revocable: there is no revoke path and the beneficiary is fixed
 * at construction. Only the beneficiary can pull vested tokens via `release()`.
 */
contract HookSwapVesting is ReentrancyGuard {
  using SafeERC20 for IERC20;

  event Released(uint256 amount);

  uint256 private _id;
  IERC20 private _token;
  address private _beneficiary;
  address private _creator;
  uint64 private _start;
  uint64 private _cliff; // cliff DURATION (seconds), measured from `_start`
  uint64 private _duration; // total vesting DURATION (seconds), measured from `_start`
  uint256 private _totalAmount;
  uint256 private _released;

  constructor(
    uint256 id_,
    address token_,
    address beneficiary_,
    address creator_,
    uint256 totalAmount_,
    uint64 startTime_,
    uint64 cliffDuration_,
    uint64 duration_
  ) {
    require(beneficiary_ != address(0), "Beneficiary cannot be the zero address");
    require(token_ != address(0), "Token cannot be the zero address");
    require(duration_ > 0, "Duration must be greater than zero");
    require(cliffDuration_ <= duration_, "Cliff must not exceed duration");

    _id = id_;
    _token = IERC20(token_);
    _beneficiary = beneficiary_;
    _creator = creator_;
    _totalAmount = totalAmount_;
    _start = startTime_;
    _cliff = cliffDuration_;
    _duration = duration_;
  }

  modifier onlyBeneficiary() {
    require(_msgSenderIsBeneficiary(), "Only the beneficiary can execute this function");
    _;
  }

  function _msgSenderIsBeneficiary() private view returns (bool) {
    return msg.sender == _beneficiary;
  }

  /**
   * @dev Amount of tokens vested at `timestamp`, in raw token units. Cliff + linear.
   * Forked from OpenZeppelin `VestingWallet._vestingSchedule` with a
   * `VestingWalletCliff` gate on `_start + _cliff`.
   */
  function vestedAmount(uint64 timestamp) public view returns (uint256) {
    uint64 cliffEnd = _start + _cliff;
    if (timestamp < cliffEnd) {
      return 0;
    } else if (timestamp >= _start + _duration) {
      return _totalAmount;
    } else {
      // linear from `_start` (not from cliff end), clamped above by the branch order.
      return (_totalAmount * (timestamp - _start)) / _duration;
    }
  }

  /** @dev vested-but-not-yet-released tokens, claimable right now. */
  function releasable() public view returns (uint256) {
    return vestedAmount(uint64(block.timestamp)) - _released;
  }

  /**
   * @dev Transfers all currently-releasable tokens to the beneficiary and bumps
   * the released accumulator. Beneficiary-only (mirrors the locker child's
   * owner-only `withdraw`).
   */
  function release() external onlyBeneficiary nonReentrant {
    uint256 amount = releasable();
    _released += amount;
    if (amount > 0) {
      _token.safeTransfer(_beneficiary, amount);
    }
    emit Released(amount);
  }

  function getScheduleData()
    external
    view
    returns (
      uint256 id,
      address token,
      address beneficiary,
      address creator,
      uint64 start,
      uint64 cliff,
      uint64 duration,
      uint256 totalAmount,
      uint256 released,
      address contractAddress
    )
  {
    id = _id;
    token = address(_token);
    beneficiary = _beneficiary;
    creator = _creator;
    start = _start;
    cliff = _cliff;
    duration = _duration;
    totalAmount = _totalAmount;
    released = _released;
    contractAddress = address(this);
  }
}
