import JSBI from 'jsbi';
export declare abstract class TickMath {
    /**
     * Cannot be constructed.
     */
    private constructor();
    /**
     * The minimum tick that can be used on any pool.
     */
    static MIN_TICK: number;
    /**
     * The maximum tick that can be used on any pool.
     */
    static MAX_TICK: number;
    /**
     * The sqrt ratio corresponding to the minimum tick that could be used on any pool.
     */
    static MIN_SQRT_RATIO: JSBI;
    /**
     * The sqrt ratio corresponding to the maximum tick that could be used on any pool.
     */
    static MAX_SQRT_RATIO: JSBI;
    /**
     * Returns the sqrt ratio as a Q64.96 for the given tick. The sqrt ratio is computed as sqrt(1.0001)^tick
     * @param tick the tick for which to compute the sqrt ratio
     */
    static getSqrtRatioAtTick(tick: number): JSBI;
    /**
     * Returns the tick corresponding to a given sqrt ratio, s.t. #getSqrtRatioAtTick(tick) <= sqrtRatioX96
     * and #getSqrtRatioAtTick(tick + 1) > sqrtRatioX96
     * @param sqrtRatioX96 the sqrt ratio as a Q64.96 for which to compute the tick
     */
    static getTickAtSqrtRatio(sqrtRatioX96: JSBI): number;
}
