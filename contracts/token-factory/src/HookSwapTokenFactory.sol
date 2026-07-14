// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import { Ownable } from "./library/Ownable.sol";
import { HookSwapERC20 } from "./HookSwapERC20.sol";

/**
 * @title HookSwapTokenFactory
 *
 * Self-service, fixed-supply ERC-20 launcher for HookSwap. Anyone can call
 * `createToken` to deploy a fresh `HookSwapERC20` whose entire supply is minted to
 * the caller. Every token is recorded in an enumerable index so the UI/indexer can
 * list what's been launched without scraping logs.
 *
 * Phase 1 is intentionally simple: each token is a plain `new HookSwapERC20(...)`
 * deploy (no clones/proxies/upgradeability) so the resulting bytecode verifies
 * cleanly on a block explorer.
 *
 * Fee model mirrors the locker suite (contracts/locker): an optional native-token
 * `createFee` forwarded to `feeReceiver`, both defaulting to free/deployer and
 * adjustable by the owner. Deploy with createFee = 0 to keep launches free.
 */
contract HookSwapTokenFactory is Ownable {
  /// @notice Emitted once per token created.
  event TokenCreated(
    address indexed token,
    address indexed creator,
    string name,
    string symbol
  );
  event CreateFeeUpdated(uint256 oldFee, uint256 newFee);
  event FeeReceiverUpdated(address oldReceiver, address newReceiver);
  event CreateFeePaid(address indexed payer, uint256 amount);

  /// @dev native-token fee required to create a token (0 = free).
  uint256 private _createFee;
  /// @dev where collected fees are sent.
  address private _feeReceiver;

  /// @dev every token this factory has deployed, in creation order.
  address[] private _allTokens;
  /// @dev tokens created by a given address.
  mapping(address => address[]) private _tokensByCreator;

  constructor(address feeReceiver_, uint256 createFee_) Ownable(_msgSender()) {
    _createFee = createFee_;
    // default the fee receiver to the deployer when not provided
    _feeReceiver = feeReceiver_ == address(0) ? _msgSender() : feeReceiver_;
  }

  /* --------------------------------------------------------------- create */

  /// @notice Deploy a new fixed-supply ERC-20; the full supply is minted to msg.sender.
  /// @param name_     Token name.
  /// @param symbol_   Token symbol.
  /// @param decimals_ Display decimals (18 is conventional).
  /// @param supply_   Total supply in base units (already scaled by 10**decimals_).
  /// @return token    Address of the newly deployed HookSwapERC20.
  function createToken(
    string calldata name_,
    string calldata symbol_,
    uint8 decimals_,
    uint256 supply_
  ) external payable returns (address token) {
    _collectFee();

    HookSwapERC20 created = new HookSwapERC20(name_, symbol_, decimals_, supply_, _msgSender());
    token = address(created);

    _allTokens.push(token);
    _tokensByCreator[_msgSender()].push(token);

    emit TokenCreated(token, _msgSender(), name_, symbol_);
  }

  /** @dev collects exactly `_createFee` in native token and forwards it to the receiver. */
  function _collectFee() private {
    uint256 fee = _createFee;
    require(msg.value >= fee, "Insufficient create fee");
    if (fee > 0) {
      (bool sent, ) = payable(_feeReceiver).call{ value: fee }("");
      require(sent, "Fee transfer failed");
      emit CreateFeePaid(_msgSender(), fee);
    }
    // refund any overpayment
    uint256 refund = msg.value - fee;
    if (refund > 0) {
      (bool refunded, ) = payable(_msgSender()).call{ value: refund }("");
      require(refunded, "Refund failed");
    }
  }

  /* ---------------------------------------------------------------- views */

  function createFee() external view returns (uint256) {
    return _createFee;
  }

  function feeReceiver() external view returns (address) {
    return _feeReceiver;
  }

  /// @notice Total number of tokens this factory has created.
  function allTokensLength() external view returns (uint256) {
    return _allTokens.length;
  }

  /// @notice Token at index `i` in creation order.
  function tokenAt(uint256 i) external view returns (address) {
    return _allTokens[i];
  }

  /// @notice Full list of tokens created (creation order). Cheap for indexers to read.
  function allTokens() external view returns (address[] memory) {
    return _allTokens;
  }

  /// @notice Tokens created by `creator`, in creation order.
  function tokensByCreator(address creator) external view returns (address[] memory) {
    return _tokensByCreator[creator];
  }

  /* -------------------------------------------------------------- admin */

  function setCreateFee(uint256 createFee_) external onlyOwner {
    emit CreateFeeUpdated(_createFee, createFee_);
    _createFee = createFee_;
  }

  function setFeeReceiver(address feeReceiver_) external onlyOwner {
    require(feeReceiver_ != address(0), "Fee receiver cannot be the zero address");
    emit FeeReceiverUpdated(_feeReceiver, feeReceiver_);
    _feeReceiver = feeReceiver_;
  }
}
