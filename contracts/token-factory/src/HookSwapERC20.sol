// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title HookSwapERC20
/// @notice A clean, fixed-supply ERC-20 minted in full to `owner` at construction.
///         Self-contained (no external imports, no remapping surprises), modelled on
///         ../seed/src/MockERC20.sol but with a constructor-driven supply/owner and
///         NO public `mint` — the total supply is fixed for the life of the token.
///
///         Deployed by HookSwapTokenFactory via a plain `new` so the bytecode is easy
///         to verify on a block explorer. This is a standard ERC-20: any wallet/DEX/
///         indexer that speaks ERC-20 can hold, transfer, and price it.
contract HookSwapERC20 {
  string public name;
  string public symbol;
  uint8 public immutable decimals;

  uint256 public totalSupply;
  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);

  /// @param _name     Token name (e.g. "Hook Token").
  /// @param _symbol   Token symbol (e.g. "HOOK").
  /// @param _decimals Display decimals (18 is conventional).
  /// @param _supply   Total supply in base units (already scaled by 10**decimals).
  /// @param _owner    Recipient of the entire supply.
  constructor(
    string memory _name,
    string memory _symbol,
    uint8 _decimals,
    uint256 _supply,
    address _owner
  ) {
    require(_owner != address(0), "HookSwapERC20: owner is zero");
    name = _name;
    symbol = _symbol;
    decimals = _decimals;

    // Mint the entire fixed supply to the owner. No further minting is possible.
    totalSupply = _supply;
    balanceOf[_owner] = _supply;
    emit Transfer(address(0), _owner, _supply);
  }

  function approve(address spender, uint256 amount) external returns (bool) {
    allowance[msg.sender][spender] = amount;
    emit Approval(msg.sender, spender, amount);
    return true;
  }

  function transfer(address to, uint256 amount) external returns (bool) {
    _transfer(msg.sender, to, amount);
    return true;
  }

  function transferFrom(address from, address to, uint256 amount) external returns (bool) {
    uint256 allowed = allowance[from][msg.sender];
    if (allowed != type(uint256).max) {
      require(allowed >= amount, "HookSwapERC20: insufficient allowance");
      allowance[from][msg.sender] = allowed - amount;
    }
    _transfer(from, to, amount);
    return true;
  }

  function _transfer(address from, address to, uint256 amount) internal {
    require(to != address(0), "HookSwapERC20: transfer to zero");
    uint256 bal = balanceOf[from];
    require(bal >= amount, "HookSwapERC20: insufficient balance");
    unchecked {
      balanceOf[from] = bal - amount;
      balanceOf[to] += amount;
    }
    emit Transfer(from, to, amount);
  }
}
