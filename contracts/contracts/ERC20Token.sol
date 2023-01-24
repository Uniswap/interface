// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Token is ERC20 {
    constructor(string memory name, string memory symbol, uint256 supply) ERC20(name, symbol) {
        _mint(msg.sender, supply);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }
}
