// SPDX-License-Identifier: MIT
// Minimal SafeERC20 (self-contained, no external deps).
// Handles non-standard ERC-20s that return no boolean (e.g. USDT) by using a
// low-level call and validating the return data.

pragma solidity ^0.8.0;

import { IERC20 } from "./IERC20.sol";

/**
 * @title SafeERC20
 * @dev Wrappers around ERC-20 operations that revert on failure (when the token
 * contract returns false, or reverts, or returns unexpected data). Tokens that
 * return no value are also supported.
 */
library SafeERC20 {
  function safeTransfer(IERC20 token, address to, uint256 value) internal {
    _callOptionalReturn(token, abi.encodeWithSelector(token.transfer.selector, to, value));
  }

  function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
    _callOptionalReturn(token, abi.encodeWithSelector(token.transferFrom.selector, from, to, value));
  }

  /**
   * @dev Set allowance to `value`. Some tokens (e.g. USDT) require the allowance
   * to be reset to 0 before it can be changed to a non-zero value, so callers of
   * this library reset to 0 after each use.
   */
  function safeApprove(IERC20 token, address spender, uint256 value) internal {
    _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, value));
  }

  /**
   * @dev Imitates a Solidity high-level call (i.e. a regular function call to a
   * contract), relaxing the requirement on the return value: the return value is
   * optional (but if data is returned, it must not be false).
   */
  function _callOptionalReturn(IERC20 token, bytes memory data) private {
    // The call target must contain code; a call to an EOA would succeed silently.
    require(address(token).code.length > 0, "SafeERC20: call to non-contract");

    (bool success, bytes memory returndata) = address(token).call(data);
    require(success, "SafeERC20: low-level call failed");

    if (returndata.length > 0) {
      require(abi.decode(returndata, (bool)), "SafeERC20: ERC20 operation did not succeed");
    }
  }
}
