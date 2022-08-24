//pragma solidity =0.6.6;
//
//import '../libraries/TeleswapV2LiquidityMathLibrary.sol';
//
//contract ExampleComputeLiquidityValue {
//    using SafeMath for uint256;
//
//    address public immutable factory;
//
//    constructor(address factory_) public {
//        factory = factory_;
//    }
//
//    // see TeleswapV2LiquidityMathLibrary#getReservesAfterArbitrage
//    function getReservesAfterArbitrage(
//        address tokenA,
//        address tokenB,
//        uint256 truePriceTokenA,
//        uint256 truePriceTokenB
//    ) external view returns (uint256 reserveA, uint256 reserveB) {
//        return TeleswapV2LiquidityMathLibrary.getReservesAfterArbitrage(
//            factory,
//            tokenA,
//            tokenB,
//            truePriceTokenA,
//            truePriceTokenB
//        );
//    }
//
//    // see TeleswapV2LiquidityMathLibrary#getLiquidityValue
//    function getLiquidityValue(
//        address tokenA,
//        address tokenB,
//        uint256 liquidityAmount
//    ) external view returns (
//        uint256 tokenAAmount,
//        uint256 tokenBAmount
//    ) {
//        return TeleswapV2LiquidityMathLibrary.getLiquidityValue(
//            factory,
//            tokenA,
//            tokenB,
//            liquidityAmount
//        );
//    }
//
//    // see TeleswapV2LiquidityMathLibrary#getLiquidityValueAfterArbitrageToPrice
//    function getLiquidityValueAfterArbitrageToPrice(
//        address tokenA,
//        address tokenB,
//        uint256 truePriceTokenA,
//        uint256 truePriceTokenB,
//        uint256 liquidityAmount
//    ) external view returns (
//        uint256 tokenAAmount,
//        uint256 tokenBAmount
//    ) {
//        return TeleswapV2LiquidityMathLibrary.getLiquidityValueAfterArbitrageToPrice(
//            factory,
//            tokenA,
//            tokenB,
//            truePriceTokenA,
//            truePriceTokenB,
//            liquidityAmount
//        );
//    }
//
//    // test function to measure the gas cost of the above function
//    function getGasCostOfGetLiquidityValueAfterArbitrageToPrice(
//        address tokenA,
//        address tokenB,
//        uint256 truePriceTokenA,
//        uint256 truePriceTokenB,
//        uint256 liquidityAmount
//    ) external view returns (
//        uint256
//    ) {
//        uint gasBefore = gasleft();
//        TeleswapV2LiquidityMathLibrary.getLiquidityValueAfterArbitrageToPrice(
//            factory,
//            tokenA,
//            tokenB,
//            truePriceTokenA,
//            truePriceTokenB,
//            liquidityAmount
//        );
//        uint gasAfter = gasleft();
//        return gasBefore - gasAfter;
//    }
//}
