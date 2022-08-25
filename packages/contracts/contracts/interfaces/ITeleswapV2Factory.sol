pragma solidity >=0.6.6;

interface ITeleswapV2Factory {
    event PairCreated(address indexed token0, address indexed token1, bool stable, address pair, uint);

    function feeTo() external view returns (address);
    function feeToSetter() external view returns (address);
    function getPair(address tokenA, address tokenB,bool stable) external view returns (address pair);
    function allPairs(uint) external view returns (address pair);
    function allPairsLength() external view returns (uint);
    function createPair(address tokenA, address tokenB, bool stable) external returns (address pair);
    function setFeeTo(address) external;
    function setFeeToSetter(address) external;
    function pairInitCodeHash() external pure returns (bytes32);
}
