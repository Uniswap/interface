// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

/**
 * HookSwap Token & LP Locker — manager (v2/v2-LP + ERC-20).
 *
 * Based on the SourceHat-audited OnlyMoons `TokenLockerManagerV1`
 * (contracts/locker/onlymoons/, GPL-3.0), extended with a configurable
 * native-token LOCK FEE. Everything else — the per-lock `HookSwapTokenLocker` child,
 * the owner search index, LP detection — is the audited behavior, unchanged.
 *
 * Scope: locks ERC-20 tokens and Uniswap-V2 LP tokens. v3 concentrated-liquidity
 * positions are ERC-721 NFTs and are handled by `HookSwapV3PositionLocker.sol`.
 *
 * NOTE: adding fees changes the audited bytecode — have this reviewed before
 * mainnet use with real value.
 */

import { Ownable } from "./Ownable.sol";
import { IERC20 } from "./library/IERC20.sol";
import { HookSwapTokenLocker } from "./HookSwapTokenLocker.sol";

// Not `is ITokenLockerManagerV1`: that interface declares createTokenLocker as
// non-payable and Solidity forbids overriding it as payable. This manager exposes
// the same functions (so ABIs/frontends match) and satisfies the only call the
// child makes back into it — notifyLockerOwnerChange.
contract HookSwapTokenLockerManager is Ownable {
  event TokenLockerCreated(
    uint40 id,
    address indexed token,
    address indexed token0,
    address indexed token1,
    address createdBy,
    uint256 balance,
    uint40 unlockTime
  );
  event LockFeeUpdated(uint256 oldFee, uint256 newFee);
  event FeeReceiverUpdated(address oldReceiver, address newReceiver);
  event LockFeePaid(address indexed payer, uint256 amount);

  constructor(uint256 lockFee_, address feeReceiver_) Ownable(_msgSender()) {
    _creationEnabled = true;
    _lockFee = lockFee_;
    // default the fee receiver to the deployer when not provided
    _feeReceiver = feeReceiver_ == address(0) ? _msgSender() : feeReceiver_;
  }

  bool private _creationEnabled;
  uint40 private _tokenLockerCount;

  /** @dev native-token fee required to create a locker (0 = free). */
  uint256 private _lockFee;
  /** @dev where collected fees are sent. */
  address private _feeReceiver;

  mapping(uint40 => HookSwapTokenLocker) private _tokenLockers;
  mapping(address => uint40[]) private _tokenLockersForAddress;

  modifier allowCreation() {
    require(_creationEnabled, "Locker creation is disabled");
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

  /* --------------------------------------------------------------- views */

  function tokenLockerCount() external view returns (uint40) {
    return _tokenLockerCount;
  }

  function creationEnabled() external view returns (bool) {
    return _creationEnabled;
  }

  function setCreationEnabled(bool value_) external onlyOwner {
    _creationEnabled = value_;
  }

  /* ------------------------------------------------------------- create */

  function createTokenLocker(
    address tokenAddress_,
    uint256 amount_,
    uint40 unlockTime_
  ) external payable allowCreation {
    _collectFee();

    uint40 id = _tokenLockerCount++;
    _tokenLockers[id] = new HookSwapTokenLocker(address(this), id, _msgSender(), tokenAddress_, unlockTime_);
    address lockerAddress = address(_tokenLockers[id]);

    IERC20 token = IERC20(tokenAddress_);
    token.transferFrom(_msgSender(), lockerAddress, amount_);

    _tokenLockersForAddress[_msgSender()].push(id);
    _tokenLockersForAddress[tokenAddress_].push(id);
    _tokenLockersForAddress[lockerAddress].push(id);

    (bool hasLpData, , address token0Address, address token1Address, , , , ) = _tokenLockers[id].getLpData();

    if (hasLpData) {
      _tokenLockersForAddress[token0Address].push(id);
      _tokenLockersForAddress[token1Address].push(id);
    }

    emit TokenLockerCreated(
      id,
      tokenAddress_,
      token0Address,
      token1Address,
      _msgSender(),
      token.balanceOf(lockerAddress),
      unlockTime_
    );
  }

  function getTokenLockAddress(uint40 id_) external view returns (address) {
    return address(_tokenLockers[id_]);
  }

  function getTokenLockData(uint40 id_) external view returns (
    bool isLpToken,
    uint40 id,
    address contractAddress,
    address lockOwner,
    address token,
    address createdBy,
    uint40 createdAt,
    uint40 unlockTime,
    uint256 balance,
    uint256 totalSupply
  ) {
    return _tokenLockers[id_].getLockData();
  }

  function getLpData(uint40 id_) external view returns (
    bool hasLpData,
    uint40 id,
    address token0,
    address token1,
    uint256 balance0,
    uint256 balance1,
    uint256 price0,
    uint256 price1
  ) {
    return _tokenLockers[id_].getLpData();
  }

  function getTokenLockersForAddress(address address_) external view returns (uint40[] memory) {
    return _tokenLockersForAddress[address_];
  }

  function notifyLockerOwnerChange(
    uint40 id_,
    address newOwner_,
    address previousOwner_,
    address createdBy_
  ) external {
    require(_msgSender() == address(_tokenLockers[id_]), "Only the locker contract can call this function");

    if (previousOwner_ != createdBy_) {
      for (uint256 i = 0; i < _tokenLockersForAddress[previousOwner_].length; i++) {
        if (_tokenLockersForAddress[previousOwner_][i] != id_) continue;
        _tokenLockersForAddress[previousOwner_][i] = _tokenLockersForAddress[previousOwner_][
          _tokenLockersForAddress[previousOwner_].length - 1
        ];
        _tokenLockersForAddress[previousOwner_].pop();
        break;
      }
    }

    bool hasId = false;
    for (uint256 i = 0; i < _tokenLockersForAddress[newOwner_].length; i++) {
      if (_tokenLockersForAddress[newOwner_][i] == id_) {
        hasId = true;
        break;
      }
    }

    if (!hasId) {
      _tokenLockersForAddress[newOwner_].push(id_);
    }
  }
}
