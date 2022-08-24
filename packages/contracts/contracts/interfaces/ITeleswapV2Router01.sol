pragma solidity >=0.6.2;
pragma experimental ABIEncoderV2;

struct route {
    address from;
    address to;
    bool stable;
}

struct Sig{
    uint8 v;
    bytes32 r;
    bytes32 s;
}

interface ITeleswapV2Router01 {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);

    function initialize(address _factory, address _WETH) external;


    function addLiquidity(
        route calldata _route,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
    function addLiquidityETH(
        route calldata _route,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    )external payable returns (uint amountToken, uint amountETH, uint liquidity);
    function removeLiquidity(
        route calldata _route,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    )  external returns (uint amountA, uint amountB);
    function removeLiquidityETH(
        route calldata _route,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    )external returns (uint amountToken, uint amountETH);
    function removeLiquidityWithPermit(
        route calldata _route,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, Sig calldata sig
    )    external returns (uint amountA, uint amountB);
    function removeLiquidityETHWithPermit(
        route calldata _route,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, Sig calldata sig
    )external returns (uint amountToken, uint amountETH);
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        route[] calldata routes,
        address to,
        uint deadline
    )  external returns (uint[] memory amounts);
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        route[] calldata routes,
        address to,
        uint deadline
    )external returns (uint[] memory amounts);
    function swapExactETHForTokens(uint amountOutMin, route[] calldata routes, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);
    function swapTokensForExactETH(uint amountOut, uint amountInMax, route[] calldata routes, address to, uint deadline)
        external
        returns (uint[] memory amounts);
    function swapExactTokensForETH(uint amountIn, uint amountOutMin, route[] calldata routes, address to, uint deadline)
        external
        returns (uint[] memory amounts);
    function swapETHForExactTokens(uint amountOut, route[] calldata routes, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts);

    function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB);
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut, bool stable,uint decimalIn,uint decimalOut) external pure returns (uint amountOut);
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut,bool stable,uint decimalIn,uint decimalOut) external pure returns (uint amountIn);
    function getAmountsOut(uint amountIn, route[] calldata routes) external view returns (uint[] memory amounts);
    function getAmountsIn(uint amountOut, route[] calldata routes) external view returns (uint[] memory amounts);
}
