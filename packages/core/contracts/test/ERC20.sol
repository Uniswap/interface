pragma solidity =0.5.16;

import '../TeleswapV2ERC20.sol';

contract ERC20 is TeleswapV2ERC20 {
    constructor(uint _totalSupply) public {
        _mint(msg.sender, _totalSupply);
    }
}
