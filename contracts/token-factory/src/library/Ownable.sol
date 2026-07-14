// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import { Context } from "./Context.sol";

/**
 * @title Ownable
 *
 * Minimal single-owner access control. Mirrors contracts/referral/Ownable.sol
 * and contracts/locker/Ownable.sol.
 */
abstract contract Ownable is Context {
  constructor(address owner_) {
    _owner_ = owner_;
    emit OwnershipTransferred(address(0), _owner());
  }

  address private _owner_;

  event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

  function _owner() internal view returns (address) {
    return _owner_;
  }

  function owner() external view returns (address) {
    return _owner();
  }

  modifier onlyOwner() {
    require(_owner() == _msgSender(), "Only the owner can execute this function");
    _;
  }

  function _transferOwnership(address newOwner_) internal virtual onlyOwner {
    address oldOwner = _owner();
    _owner_ = newOwner_;
    emit OwnershipTransferred(oldOwner, _owner());
  }

  function transferOwnership(address newOwner_) external onlyOwner {
    _transferOwnership(newOwner_);
  }
}
