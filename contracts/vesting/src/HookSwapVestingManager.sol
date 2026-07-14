// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

/**
 * HookSwap self-service token vesting — manager (factory + registry).
 *
 * Isomorphic to the `HookSwapTokenLockerManager` in `contracts/locker/`: one
 * `HookSwapVesting` child is deployed per schedule, funded via `transferFrom`,
 * and indexed in an on-chain address search index so the same discovery pattern
 * (`getSchedulesForAddress` ≙ the locker's `getTokenLockersForAddress`) works.
 *
 * Includes the locker's optional native-token fee model (`_collectFee` /
 * `feeReceiver`), owner-gated. Phase 1 vesting is NON-revocable.
 */

import { Ownable } from "../library/Ownable.sol";
import { IERC20 } from "../library/IERC20.sol";
import { SafeERC20 } from "../library/SafeERC20.sol";
import { ReentrancyGuard } from "../library/ReentrancyGuard.sol";
import { HookSwapVesting } from "./HookSwapVesting.sol";

contract HookSwapVestingManager is Ownable, ReentrancyGuard {
  using SafeERC20 for IERC20;
  event VestingCreated(
    uint256 indexed id,
    address indexed child,
    address token,
    address indexed beneficiary,
    address creator
  );
  event VestingFeeUpdated(uint256 oldFee, uint256 newFee);
  event FeeReceiverUpdated(address oldReceiver, address newReceiver);
  event VestingFeePaid(address indexed payer, uint256 amount);

  constructor(uint256 vestingFee_, address feeReceiver_) Ownable(_msgSender()) {
    _creationEnabled = true;
    _vestingFee = vestingFee_;
    // default the fee receiver to the deployer when not provided
    _feeReceiver = feeReceiver_ == address(0) ? _msgSender() : feeReceiver_;
  }

  bool private _creationEnabled;
  uint256 private _vestingCount;

  /** @dev native-token fee required to create a vesting schedule (0 = free). */
  uint256 private _vestingFee;
  /** @dev where collected fees are sent. */
  address private _feeReceiver;

  mapping(uint256 => HookSwapVesting) private _vestings;
  mapping(address => uint256[]) private _schedulesForAddress;

  modifier allowCreation() {
    require(_creationEnabled, "Vesting creation is disabled");
    _;
  }

  /* --------------------------------------------------------------- fees */

  function vestingFee() external view returns (uint256) {
    return _vestingFee;
  }

  function feeReceiver() external view returns (address) {
    return _feeReceiver;
  }

  function setVestingFee(uint256 vestingFee_) external onlyOwner {
    emit VestingFeeUpdated(_vestingFee, vestingFee_);
    _vestingFee = vestingFee_;
  }

  function setFeeReceiver(address feeReceiver_) external onlyOwner {
    require(feeReceiver_ != address(0), "Fee receiver cannot be the zero address");
    emit FeeReceiverUpdated(_feeReceiver, feeReceiver_);
    _feeReceiver = feeReceiver_;
  }

  /** @dev collects exactly `_vestingFee` in native token and forwards it to the receiver. */
  function _collectFee() private {
    uint256 fee = _vestingFee;
    require(msg.value >= fee, "Insufficient vesting fee");
    if (fee > 0) {
      (bool sent, ) = payable(_feeReceiver).call{ value: fee }("");
      require(sent, "Fee transfer failed");
      emit VestingFeePaid(_msgSender(), fee);
    }
    // refund any overpayment
    uint256 refund = msg.value - fee;
    if (refund > 0) {
      (bool refunded, ) = payable(_msgSender()).call{ value: refund }("");
      require(refunded, "Refund failed");
    }
  }

  /* --------------------------------------------------------------- views */

  function vestingCount() external view returns (uint256) {
    return _vestingCount;
  }

  function creationEnabled() external view returns (bool) {
    return _creationEnabled;
  }

  function setCreationEnabled(bool value_) external onlyOwner {
    _creationEnabled = value_;
  }

  /* ------------------------------------------------------------- create */

  /**
   * @dev Deploys a new `HookSwapVesting` child, pulls `amount` of `token` from the
   * caller into the child to fund it, and indexes the new schedule id under BOTH
   * the beneficiary and the creator (`msg.sender`).
   *
   * `startTime` is an absolute unix timestamp; `cliffDuration` / `duration` are
   * relative to it (seconds). Non-revocable.
   */
  function createVesting(
    address token,
    address beneficiary,
    uint256 amount,
    uint64 startTime,
    uint64 cliffDuration,
    uint64 duration
  ) external payable allowCreation nonReentrant {
    require(amount > 0, "Vesting amount must be greater than zero");
    _collectFee();

    uint256 id = _vestingCount++;
    HookSwapVesting child = new HookSwapVesting(
      id,
      token,
      beneficiary,
      _msgSender(),
      amount,
      startTime,
      cliffDuration,
      duration
    );
    _vestings[id] = child;
    address childAddress = address(child);

    // fund the child schedule from the caller.
    // NOTE: fee-on-transfer tokens are NOT supported — the child is created with
    // `amount` as its total, but a fee-on-transfer token would deliver less than
    // `amount` to the child, over-stating the vested total (M-1, out of scope).
    IERC20(token).safeTransferFrom(_msgSender(), childAddress, amount);

    // index under beneficiary + creator (dedupe when they are the same address)
    _schedulesForAddress[beneficiary].push(id);
    if (_msgSender() != beneficiary) {
      _schedulesForAddress[_msgSender()].push(id);
    }

    emit VestingCreated(id, childAddress, token, beneficiary, _msgSender());
  }

  /* -------------------------------------------------------------- lookups */

  function getVestingAddress(uint256 id_) external view returns (address) {
    return address(_vestings[id_]);
  }

  function getSchedulesForAddress(address address_) external view returns (uint256[] memory) {
    return _schedulesForAddress[address_];
  }

  function getScheduleData(uint256 id_)
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
    return _vestings[id_].getScheduleData();
  }
}
