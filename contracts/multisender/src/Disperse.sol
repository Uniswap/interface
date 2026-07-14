// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import { IERC20 } from "../library/IERC20.sol";
import { SafeERC20 } from "../library/SafeERC20.sol";

/**
 * @title Disperse
 *
 * HookSwap's batch-send ("multisender" / disperse) utility — send one ERC-20 (or the
 * native currency) to many recipients in a SINGLE transaction. A fork of the canonical,
 * public-domain Disperse.app contract, modernised to solc 0.8.24.
 *
 * Design (trustless + minimal):
 *   • Stateless — no storage, no owner, no admin, no fees. There is nothing to configure
 *     and no privileged party.
 *   • NEVER custodies funds. The token path pulls tokens PER RECIPIENT straight from the
 *     caller via `transferFrom(msg.sender, recipients[i], amounts[i])`, so the contract
 *     never holds a balance between transfers. The ether path forwards each `amounts[i]`
 *     with the call and refunds any unused `msg.value` dust back to the caller.
 *
 * Token approvals: the caller approves this contract for AT LEAST the sum of `amounts`
 * (a plain ERC-20 allowance — NO Permit2) before calling {disperseToken}; each
 * `transferFrom` then draws against that allowance.
 *
 * NOT audited. Vendors a minimal `IERC20` + `SafeERC20` (no OpenZeppelin import), matching
 * the sibling `contracts/referral` / `contracts/locker` kits.
 */
contract Disperse {
  using SafeERC20 for IERC20;

  /// @dev `recipients` and `amounts` must be the same length.
  error LengthMismatch();
  /// @dev Nothing to send (empty recipient list).
  error EmptyRecipients();
  /// @dev A native-currency transfer to `recipient` failed (recipient reverted / OOG).
  error EtherTransferFailed(address recipient);

  /**
   * @notice Batch-send an ERC-20 to many recipients, pulling PER RECIPIENT from the caller.
   * @dev Uses `SafeERC20.safeTransferFrom` so non-standard tokens (e.g. USDT, which returns
   *      no bool) work. The contract never holds the tokens — each transfer goes directly
   *      from `msg.sender` to `recipients[i]`. Requires the caller to have approved this
   *      contract for at least `sum(amounts)`.
   * @param token      The ERC-20 to distribute.
   * @param recipients Destination addresses.
   * @param amounts    Amount (in token base units) for each corresponding recipient.
   */
  function disperseToken(
    IERC20 token,
    address[] calldata recipients,
    uint256[] calldata amounts
  ) external {
    uint256 len = recipients.length;
    if (len != amounts.length) {
      revert LengthMismatch();
    }
    if (len == 0) {
      revert EmptyRecipients();
    }
    for (uint256 i = 0; i < len; ) {
      token.safeTransferFrom(msg.sender, recipients[i], amounts[i]);
      unchecked {
        ++i;
      }
    }
  }

  /**
   * @notice Batch-send the native currency to many recipients in one tx.
   * @dev Forwards each `amounts[i]` with a low-level call. Any unused `msg.value` (the
   *      caller may over-send to cover rounding) is refunded to `msg.sender` at the end,
   *      so the contract never retains a balance.
   * @param recipients Destination addresses.
   * @param amounts    Amount (in wei) for each corresponding recipient.
   */
  function disperseEther(address[] calldata recipients, uint256[] calldata amounts) external payable {
    uint256 len = recipients.length;
    if (len != amounts.length) {
      revert LengthMismatch();
    }
    if (len == 0) {
      revert EmptyRecipients();
    }
    for (uint256 i = 0; i < len; ) {
      (bool ok, ) = recipients[i].call{ value: amounts[i] }("");
      if (!ok) {
        revert EtherTransferFailed(recipients[i]);
      }
      unchecked {
        ++i;
      }
    }
    // Refund any dust (over-sent value) so the contract never custodies native funds.
    uint256 remaining = address(this).balance;
    if (remaining > 0) {
      (bool refunded, ) = msg.sender.call{ value: remaining }("");
      if (!refunded) {
        revert EtherTransferFailed(msg.sender);
      }
    }
  }
}
