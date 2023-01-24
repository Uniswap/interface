// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./ERC20Token.sol";

contract Token5 is ERC20Token {
    constructor(string memory name, string memory symbol, uint256 supply) ERC20Token(name, symbol, supply) {}
}
