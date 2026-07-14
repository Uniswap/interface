// SPDX-License-Identifier: GPL-3.0
// Derived from OnlyMoons (github.com/onlymoons-io/onlymoons), GPL-3.0.

pragma solidity ^0.8.0;

import { Ownable } from "./Ownable.sol";
import { IUniswapV2Pair } from "./library/Dex.sol";
import { IERC20 } from "./library/IERC20.sol";
import { SafeERC20 } from "./library/SafeERC20.sol";
import { Util } from "./Util.sol";

/**
 * @dev minimal callback interface implemented by HookSwapTokenLockerManager.
 * The child only ever calls back into the manager to keep the owner search
 * index up to date when lock ownership is transferred.
 */
interface IHookSwapLockerManager {
  function notifyLockerOwnerChange(
    uint40 id_,
    address newOwner_,
    address previousOwner_,
    address createdBy_
  ) external;
}

/**
 * @title HookSwapTokenLocker
 *
 * Per-lock child contract that custodies a single ERC-20 token or Uniswap-V2 LP
 * token balance until `unlockTime`. Created by HookSwapTokenLockerManager.
 *
 * Logic preserved unchanged from the SourceHat-audited OnlyMoons `TokenLockerV1`;
 * only the contract name and the manager callback interface were rebranded.
 */
contract HookSwapTokenLocker is Ownable {
  using SafeERC20 for IERC20;

  event Extended(uint40 newUnlockTime);
  event Deposited(uint256 amount);
  event Withdrew();

  constructor(address manager_, uint40 id_, address owner_, address tokenAddress_, uint40 unlockTime_) Ownable(owner_) {
    require(unlockTime_ > uint40(block.timestamp), "Unlock time must be in the future");

    _manager = IHookSwapLockerManager(manager_);
    _id = id_;
    _token = IERC20(tokenAddress_);
    _createdBy = owner_;
    _createdAt = uint40(block.timestamp);
    _unlockTime = unlockTime_;
    _isLpToken = Util.isLpToken(tokenAddress_);
  }

  IHookSwapLockerManager private _manager;
  bool private _isLpToken;
  uint40 private _id;
  IERC20 private _token;
  address private _createdBy;
  uint40 private _createdAt;
  uint40 private _unlockTime;

  bool private _transferLocked;

  modifier transferLocked() {
    require(!_transferLocked, "Transfering is locked. Wait for the previous transaction to complete");
    _transferLocked = true;
    _;
    _transferLocked = false;
  }

  function _balance() private view returns (uint256) {
    return _token.balanceOf(address(this));
  }

  function getIsLpToken() external view returns (bool) {
    return _isLpToken;
  }

  function getLockData() external view returns (
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
  ){
    isLpToken = _isLpToken;
    id = _id;
    contractAddress = address(this);
    lockOwner = _owner();
    token = address(_token);
    createdBy = _createdBy;
    createdAt = _createdAt;
    unlockTime = _unlockTime;
    balance = _balance();
    totalSupply = _token.totalSupply();
  }

  function getLpData() external view returns (
    bool hasLpData,
    uint40 id,
    address token0,
    address token1,
    uint256 balance0,
    uint256 balance1,
    uint256 price0,
    uint256 price1
  ) {
    // always return the id
    id = _id;

    if (!_isLpToken) {
      // if this isn't an lp token, don't even bother calling getLpData
      hasLpData = false;
    } else {
      // this is an lp token, so let's get some data
      try Util.getLpData(address(_token)) returns (
        address token0_,
        address token1_,
        uint256 balance0_,
        uint256 balance1_,
        uint256 price0_,
        uint256 price1_
      ){
        hasLpData = true;
        token0 = token0_;
        token1 = token1_;
        balance0 = balance0_;
        balance1 = balance1_;
        price0 = price0_;
        price1 = price1_;
      } catch Error(string memory /* reason */) {
        hasLpData = false;
      } catch (bytes memory /* lowLevelData */) {
        hasLpData = false;
      }
    }
  }

  /**
   * @dev deposit and extend duration in one call
   */
  function deposit(uint256 amount_, uint40 newUnlockTime_) external onlyOwner transferLocked {
    if (newUnlockTime_ != 0) {
      require(
        newUnlockTime_ >= _unlockTime && newUnlockTime_ >= uint40(block.timestamp),
        "New unlock time must be a future time beyond the previous value"
      );
      _unlockTime = newUnlockTime_;
      emit Extended(_unlockTime);
    }

    if (amount_ != 0) {
      uint256 oldBalance = _balance();
      _token.safeTransferFrom(_msgSender(), address(this), amount_);
      emit Deposited(_balance() - oldBalance);
    }
  }

  /**
   * @dev withdraw all of the deposited token
   */
  function withdraw() external onlyOwner transferLocked {
    require(uint40(block.timestamp) >= _unlockTime, "Wait until unlockTime to withdraw");

    _token.safeTransfer(_owner(), _balance());

    emit Withdrew();
  }

  /**
   * @dev recovery function -
   * just in case this contract winds up with additional tokens (from dividends, etc).
   * attempting to withdraw the locked token will revert.
   */
  function withdrawToken(address address_) external onlyOwner transferLocked {
    require(address_ != address(_token), "Use 'withdraw' to withdraw the primary locked token");

    IERC20 theToken = IERC20(address_);
    theToken.transfer(_owner(), theToken.balanceOf(address(this)));
  }

  /**
   * @dev recovery function -
   * just in case this contract winds up with eth in it (from dividends etc)
   */
  function withdrawEth() external onlyOwner transferLocked {
    address payable receiver = payable(_owner());
    receiver.transfer(address(this).balance);
  }

  function _transferOwnership(address newOwner_) override internal onlyOwner {
    address previousOwner = _owner();
    super._transferOwnership(newOwner_);

    // we need to notify the manager contract that we transferred
    // ownership, so that the new owner is searchable.
    _manager.notifyLockerOwnerChange(_id, newOwner_, previousOwner, _createdBy);
  }

  receive() external payable {
    // we need this function to receive eth,
    // which might happen from dividend tokens.
    // use `withdrawEth` to remove eth from the contract.
  }
}
