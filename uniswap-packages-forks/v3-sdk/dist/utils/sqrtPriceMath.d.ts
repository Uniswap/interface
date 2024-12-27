import JSBI from 'jsbi';
export declare abstract class SqrtPriceMath {
    /**
     * Cannot be constructed.
     */
    private constructor();
    static getAmount0Delta(sqrtRatioAX96: JSBI, sqrtRatioBX96: JSBI, liquidity: JSBI, roundUp: boolean): JSBI;
    static getAmount1Delta(sqrtRatioAX96: JSBI, sqrtRatioBX96: JSBI, liquidity: JSBI, roundUp: boolean): JSBI;
    static getNextSqrtPriceFromInput(sqrtPX96: JSBI, liquidity: JSBI, amountIn: JSBI, zeroForOne: boolean): JSBI;
    static getNextSqrtPriceFromOutput(sqrtPX96: JSBI, liquidity: JSBI, amountOut: JSBI, zeroForOne: boolean): JSBI;
    private static getNextSqrtPriceFromAmount0RoundingUp;
    private static getNextSqrtPriceFromAmount1RoundingDown;
}
