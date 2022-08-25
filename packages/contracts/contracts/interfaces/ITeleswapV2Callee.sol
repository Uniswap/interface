pragma solidity >=0.6.6;

interface ITeleswapV2Callee {
    function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external;
}
