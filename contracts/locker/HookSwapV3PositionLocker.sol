// SPDX-License-Identifier: GPL-3.0
// Derived from OnlyMoons (github.com/onlymoons-io/onlymoons), GPL-3.0.
//
// HookSwap V3 Position Locker — locks Uniswap-V3 concentrated-liquidity
// positions (ERC-721 NFTs from the NonfungiblePositionManager).
//
// The OnlyMoons v2 locker custodies fungible ERC-20 / v2-LP tokens and cannot
// hold a v3 position NFT. This locker fills that gap while reusing the same
// native-token fee model and owner-search-index conventions as
// HookSwapTokenLockerManager. Its key feature: while the position principal
// stays locked, the lock owner can still claim the position's accrued trading
// fees via `collectFees`.
//
// NOTE: this is NEW code (not part of the audited OnlyMoons base). Get a fresh
// security review before using it with real value.

pragma solidity ^0.8.0;

import { Ownable } from "./Ownable.sol";
import { ReentrancyGuard } from "./library/ReentrancyGuard.sol";
import { IERC721Receiver } from "./library/IERC721Receiver.sol";

/**
 * @dev Minimal subset of the Uniswap-V3 NonfungiblePositionManager interface
 * used by this locker.
 */
interface INonfungiblePositionManager {
  struct CollectParams {
    uint256 tokenId;
    address recipient;
    uint128 amount0Max;
    uint128 amount1Max;
  }

  function positions(uint256 tokenId) external view returns (
    uint96 nonce,
    address operator,
    address token0,
    address token1,
    uint24 fee,
    int24 tickLower,
    int24 tickUpper,
    uint128 liquidity,
    uint256 feeGrowthInside0LastX128,
    uint256 feeGrowthInside1LastX128,
    uint128 tokensOwed0,
    uint128 tokensOwed1
  );

  function collect(CollectParams calldata params) external payable returns (uint256 amount0, uint256 amount1);

  function ownerOf(uint256 tokenId) external view returns (address);

  function safeTransferFrom(address from, address to, uint256 tokenId) external;

  function transferFrom(address from, address to, uint256 tokenId) external;
}

/**
 * @title HookSwapV3PositionLocker
 */
contract HookSwapV3PositionLocker is Ownable, ReentrancyGuard, IERC721Receiver {
  struct V3Lock {
    uint256 id;
    address owner;
    address nftManager;
    uint256 tokenId;
    address createdBy;
    uint40 createdAt;
    uint40 unlockTime;
    bool withdrawn;
  }

  event PositionLocked(
    uint256 indexed id,
    address indexed nftManager,
    uint256 indexed tokenId,
    address owner,
    uint40 unlockTime
  );
  event PositionExtended(uint256 indexed id, uint40 newUnlockTime);
  event PositionWithdrawn(uint256 indexed id, address indexed to, uint256 tokenId);
  event FeesCollected(uint256 indexed id, address indexed recipient, uint256 amount0, uint256 amount1);
  event LockOwnershipTransferred(uint256 indexed id, address indexed previousOwner, address indexed newOwner);
  event LockFeeUpdated(uint256 oldFee, uint256 newFee);
  event FeeReceiverUpdated(address oldReceiver, address newReceiver);
  event LockFeePaid(address indexed payer, uint256 amount);

  constructor(uint256 lockFee_, address feeReceiver_) Ownable(_msgSender()) {
    _lockFee = lockFee_;
    // default the fee receiver to the deployer when not provided
    _feeReceiver = feeReceiver_ == address(0) ? _msgSender() : feeReceiver_;
  }

  uint256 private _lockCount;

  /** @dev native-token fee required to create a lock (0 = free). */
  uint256 private _lockFee;
  /** @dev where collected fees are sent. */
  address private _feeReceiver;

  /** @dev main mapping for lock data */
  mapping(uint256 => V3Lock) private _locks;

  /** @dev owner search index (same convention as the v2 manager) */
  mapping(address => uint256[]) private _locksForAddress;

  /**
   * @dev Set true only for the duration of the safeTransferFrom inside `lock()`.
   * onERC721Received requires it, so an NFT can only enter this contract as part
   * of an in-progress lock — a direct safeTransferFrom (not via lock) reverts,
   * preventing NFTs from getting permanently stuck with no way out.
   */
  bool private _lockInProgress;

  modifier onlyLockOwner(uint256 lockId_) {
    require(_locks[lockId_].owner == _msgSender(), "Only the lock owner can execute this function");
    _;
  }

  /* --------------------------------------------------------------- fees */

  function lockFee() external view returns (uint256) {
    return _lockFee;
  }

  function feeReceiver() external view returns (address) {
    return _feeReceiver;
  }

  function setLockFee(uint256 lockFee_) external onlyOwner {
    emit LockFeeUpdated(_lockFee, lockFee_);
    _lockFee = lockFee_;
  }

  function setFeeReceiver(address feeReceiver_) external onlyOwner {
    require(feeReceiver_ != address(0), "Fee receiver cannot be the zero address");
    emit FeeReceiverUpdated(_feeReceiver, feeReceiver_);
    _feeReceiver = feeReceiver_;
  }

  /** @dev collects exactly `_lockFee` in native token and forwards it to the receiver. */
  function _collectFee() private {
    uint256 fee = _lockFee;
    require(msg.value >= fee, "Insufficient lock fee");
    if (fee > 0) {
      (bool sent, ) = payable(_feeReceiver).call{ value: fee }("");
      require(sent, "Fee transfer failed");
      emit LockFeePaid(_msgSender(), fee);
    }
    // refund any overpayment
    uint256 refund = msg.value - fee;
    if (refund > 0) {
      (bool refunded, ) = payable(_msgSender()).call{ value: refund }("");
      require(refunded, "Refund failed");
    }
  }

  /* --------------------------------------------------------------- lock */

  /**
   * @dev lock a v3 position NFT until `unlockTime_`. Charges the native-token
   * lock fee (overpayment refunded) and pulls the NFT in via safeTransferFrom.
   */
  function lock(
    address nftManager_,
    uint256 tokenId_,
    uint40 unlockTime_
  ) external payable nonReentrant returns (uint256 id) {
    require(nftManager_ != address(0), "NFT manager cannot be the zero address");
    require(unlockTime_ > uint40(block.timestamp), "Unlock time must be in the future");

    _collectFee();

    id = _lockCount++;

    _locks[id] = V3Lock({
      id: id,
      owner: _msgSender(),
      nftManager: nftManager_,
      tokenId: tokenId_,
      createdBy: _msgSender(),
      createdAt: uint40(block.timestamp),
      unlockTime: unlockTime_,
      withdrawn: false
    });

    // add to the owner search index
    _locksForAddress[_msgSender()].push(id);

    // pull the NFT in. this triggers onERC721Received on this contract.
    // gate the receiver hook to this window so stray direct transfers revert.
    _lockInProgress = true;
    INonfungiblePositionManager(nftManager_).safeTransferFrom(_msgSender(), address(this), tokenId_);
    _lockInProgress = false;

    emit PositionLocked(id, nftManager_, tokenId_, _msgSender(), unlockTime_);
  }

  /**
   * @dev ERC-721 receiver hook — required to accept safe transfers.
   * Only accepts NFTs that arrive as part of an in-progress `lock()` (guarded by
   * `_lockInProgress`); a direct safeTransferFrom outside `lock()` reverts, so
   * NFTs can't be sent here and left permanently stuck.
   */
  function onERC721Received(
    address /* operator */,
    address /* from */,
    uint256 /* tokenId */,
    bytes calldata /* data */
  ) external override returns (bytes4) {
    require(_lockInProgress, "Only accepts NFTs via lock()");
    return IERC721Receiver.onERC721Received.selector;
  }

  /**
   * @dev while locked, the lock owner collects the position's accrued trading
   * fees. Principal (liquidity) stays locked; only fees are sent to the owner.
   */
  function collectFees(uint256 lockId_)
    external
    nonReentrant
    onlyLockOwner(lockId_)
    returns (uint256 amount0, uint256 amount1)
  {
    V3Lock storage lock_ = _locks[lockId_];
    require(!lock_.withdrawn, "Position already withdrawn");

    (amount0, amount1) = INonfungiblePositionManager(lock_.nftManager).collect(
      INonfungiblePositionManager.CollectParams({
        tokenId: lock_.tokenId,
        recipient: lock_.owner,
        amount0Max: type(uint128).max,
        amount1Max: type(uint128).max
      })
    );

    emit FeesCollected(lockId_, lock_.owner, amount0, amount1);
  }

  /**
   * @dev extend the lock. New time must be >= current unlock time and in the future.
   */
  function extend(uint256 lockId_, uint40 newUnlockTime_) external onlyLockOwner(lockId_) {
    V3Lock storage lock_ = _locks[lockId_];
    require(!lock_.withdrawn, "Position already withdrawn");
    require(
      newUnlockTime_ >= lock_.unlockTime && newUnlockTime_ >= uint40(block.timestamp),
      "New unlock time must be a future time beyond the previous value"
    );
    lock_.unlockTime = newUnlockTime_;
    emit PositionExtended(lockId_, newUnlockTime_);
  }

  /**
   * @dev after unlockTime, transfer the position NFT back to the lock owner.
   */
  function withdraw(uint256 lockId_) external nonReentrant onlyLockOwner(lockId_) {
    V3Lock storage lock_ = _locks[lockId_];
    require(!lock_.withdrawn, "Position already withdrawn");
    require(uint40(block.timestamp) >= lock_.unlockTime, "Wait until unlockTime to withdraw");

    lock_.withdrawn = true;

    INonfungiblePositionManager(lock_.nftManager).safeTransferFrom(address(this), lock_.owner, lock_.tokenId);

    emit PositionWithdrawn(lockId_, lock_.owner, lock_.tokenId);
  }

  /**
   * @dev transfer ownership of a lock to a new address, keeping the owner
   * search index in sync (same replace-and-pop pattern as the v2 manager).
   */
  function transferLockOwnership(uint256 lockId_, address newOwner_) external onlyLockOwner(lockId_) {
    require(newOwner_ != address(0), "New owner cannot be the zero address");

    V3Lock storage lock_ = _locks[lockId_];
    address previousOwner = lock_.owner;

    // remove from previous owner's index, unless it's the original creator
    // (the creator entry is kept so history stays searchable, mirroring the v2 manager).
    if (previousOwner != lock_.createdBy) {
      uint256[] storage prev = _locksForAddress[previousOwner];
      for (uint256 i = 0; i < prev.length; i++) {
        if (prev[i] != lockId_) continue;
        prev[i] = prev[prev.length - 1];
        prev.pop();
        break;
      }
    }

    lock_.owner = newOwner_;

    // add to new owner's index only if not already present
    bool hasId = false;
    uint256[] storage next = _locksForAddress[newOwner_];
    for (uint256 i = 0; i < next.length; i++) {
      if (next[i] == lockId_) {
        hasId = true;
        break;
      }
    }
    if (!hasId) {
      next.push(lockId_);
    }

    emit LockOwnershipTransferred(lockId_, previousOwner, newOwner_);
  }

  /* --------------------------------------------------------------- views */

  function lockCount() external view returns (uint256) {
    return _lockCount;
  }

  function getLocksForAddress(address address_) external view returns (uint256[] memory) {
    return _locksForAddress[address_];
  }

  function getLockData(uint256 lockId_) external view returns (
    uint256 id,
    address lockOwner,
    address nftManager,
    uint256 tokenId,
    address createdBy,
    uint40 createdAt,
    uint40 unlockTime,
    bool withdrawn
  ) {
    V3Lock storage lock_ = _locks[lockId_];
    id = lock_.id;
    lockOwner = lock_.owner;
    nftManager = lock_.nftManager;
    tokenId = lock_.tokenId;
    createdBy = lock_.createdBy;
    createdAt = lock_.createdAt;
    unlockTime = lock_.unlockTime;
    withdrawn = lock_.withdrawn;
  }
}
