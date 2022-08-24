//pragma solidity =0.6.6;
//
//import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
//import '@uniswap/lib/contracts/libraries/Babylonian.sol';
//import '@uniswap/lib/contracts/libraries/TransferHelper.sol';
//
//import '../libraries/TeleswapV2LiquidityMathLibrary.sol';
//import '../interfaces/IERC20.sol';
//import '../interfaces/ITeleswapV2Router01.sol';
//import '../libraries/SafeMath.sol';
//import '../libraries/TeleswapV2Library.sol';
//
//contract ExampleSwapToPrice {
//    using SafeMath for uint256;
//
//    ITeleswapV2Router01 public immutable router;
//    address public immutable factory;
//
//    constructor(address factory_, ITeleswapV2Router01 router_) public {
//        factory = factory_;
//        router = router_;
//    }
//
//    // swaps an amount of either token such that the trade is profit-maximizing, given an external true price
//    // true price is expressed in the ratio of token A to token B
//    // caller must approve this contract to spend whichever token is intended to be swapped
//    function swapToPrice(
//        address tokenA,
//        address tokenB,
//        bool stable,
//        uint256 truePriceTokenA,
//        uint256 truePriceTokenB,
//        uint256 maxSpendTokenA,
//        uint256 maxSpendTokenB,
//        address to,
//        uint256 deadline
//    ) public {
//        // true price is expressed as a ratio, so both values must be non-zero
//        require(truePriceTokenA != 0 && truePriceTokenB != 0, "ExampleSwapToPrice: ZERO_PRICE");
//        // caller can specify 0 for either if they wish to swap in only one direction, but not both
//        require(maxSpendTokenA != 0 || maxSpendTokenB != 0, "ExampleSwapToPrice: ZERO_SPEND");
//
//        bool aToB;
//        uint256 amountIn;
//        {
//            (uint256 reserveA, uint256 reserveB) = TeleswapV2Library.getReserves(factory, tokenA, tokenB,stable);
//            (aToB, amountIn) = TeleswapV2LiquidityMathLibrary.computeProfitMaximizingTrade(
//                truePriceTokenA, truePriceTokenB,
//                reserveA, reserveB
//            );
//        }
//
//        require(amountIn > 0, 'ExampleSwapToPrice: ZERO_AMOUNT_IN');
//
//        // spend up to the allowance of the token in
//        uint256 maxSpend = aToB ? maxSpendTokenA : maxSpendTokenB;
//        if (amountIn > maxSpend) {
//            amountIn = maxSpend;
//        }
//
//        address tokenIn = aToB ? tokenA : tokenB;
//        address tokenOut = aToB ? tokenB : tokenA;
//        TransferHelper.safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);
//        TransferHelper.safeApprove(tokenIn, address(router), amountIn);
//
//        route[] memory routes = new route[](2);
//        routes[0].from = tokenIn;
//        routes[0].to = tokenOut;
//
//        router.swapExactTokensForTokens(
//            amountIn,
//            0, // amountOutMin: we can skip computing this number because the math is tested
//            routes,
//            to,
//            deadline
//        );
//    }
//}
