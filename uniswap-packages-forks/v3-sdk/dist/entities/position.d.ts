import { BigintIsh, Percent, Price, CurrencyAmount, Token } from '@uniswap/sdk-core';
import JSBI from 'jsbi';
import { Pool } from './pool';
interface PositionConstructorArgs {
    pool: Pool;
    tickLower: number;
    tickUpper: number;
    liquidity: BigintIsh;
}
/**
 * Represents a position on a Uniswap V3 Pool
 */
export declare class Position {
    readonly pool: Pool;
    readonly tickLower: number;
    readonly tickUpper: number;
    readonly liquidity: JSBI;
    private _token0Amount;
    private _token1Amount;
    private _mintAmounts;
    /**
     * Constructs a position for a given pool with the given liquidity
     * @param pool for which pool the liquidity is assigned
     * @param liquidity the amount of liquidity that is in the position
     * @param tickLower the lower tick of the position
     * @param tickUpper the upper tick of the position
     */
    constructor({ pool, liquidity, tickLower, tickUpper }: PositionConstructorArgs);
    /**
     * Returns the price of token0 at the lower tick
     */
    get token0PriceLower(): Price<Token, Token>;
    /**
     * Returns the price of token0 at the upper tick
     */
    get token0PriceUpper(): Price<Token, Token>;
    /**
     * Returns the amount of token0 that this position's liquidity could be burned for at the current pool price
     */
    get amount0(): CurrencyAmount<Token>;
    /**
     * Returns the amount of token1 that this position's liquidity could be burned for at the current pool price
     */
    get amount1(): CurrencyAmount<Token>;
    /**
     * Returns the lower and upper sqrt ratios if the price 'slips' up to slippage tolerance percentage
     * @param slippageTolerance amount by which the price can 'slip'
     * @private
     */
    private ratiosAfterSlippage;
    /**
     * Returns the minimum amounts that must be sent in order to safely mint the amount of liquidity held by the position
     * with the given slippage tolerance
     * @param slippageTolerance tolerance of unfavorable slippage from the current price
     */
    mintAmountsWithSlippage(slippageTolerance: Percent): Readonly<{
        amount0: JSBI;
        amount1: JSBI;
    }>;
    /**
     * Returns the minimum amounts that should be requested in order to safely burn the amount of liquidity held by the
     * position with the given slippage tolerance
     * @param slippageTolerance tolerance of unfavorable slippage from the current price
     */
    burnAmountsWithSlippage(slippageTolerance: Percent): Readonly<{
        amount0: JSBI;
        amount1: JSBI;
    }>;
    /**
     * Returns the minimum amounts that must be sent in order to mint the amount of liquidity held by the position at
     * the current price for the pool
     */
    get mintAmounts(): Readonly<{
        amount0: JSBI;
        amount1: JSBI;
    }>;
    /**
     * Computes the maximum amount of liquidity received for a given amount of token0, token1,
     * and the prices at the tick boundaries.
     * @param pool the pool for which the position should be created
     * @param tickLower the lower tick of the position
     * @param tickUpper the upper tick of the position
     * @param amount0 token0 amount
     * @param amount1 token1 amount
     * @param useFullPrecision if false, liquidity will be maximized according to what the router can calculate,
     * not what core can theoretically support
     */
    static fromAmounts({ pool, tickLower, tickUpper, amount0, amount1, useFullPrecision }: {
        pool: Pool;
        tickLower: number;
        tickUpper: number;
        amount0: BigintIsh;
        amount1: BigintIsh;
        useFullPrecision: boolean;
    }): Position;
    /**
     * Computes a position with the maximum amount of liquidity received for a given amount of token0, assuming an unlimited amount of token1
     * @param pool the pool for which the position is created
     * @param tickLower the lower tick
     * @param tickUpper the upper tick
     * @param amount0 the desired amount of token0
     * @param useFullPrecision if true, liquidity will be maximized according to what the router can calculate,
     * not what core can theoretically support
     */
    static fromAmount0({ pool, tickLower, tickUpper, amount0, useFullPrecision }: {
        pool: Pool;
        tickLower: number;
        tickUpper: number;
        amount0: BigintIsh;
        useFullPrecision: boolean;
    }): Position;
    /**
     * Computes a position with the maximum amount of liquidity received for a given amount of token1, assuming an unlimited amount of token0
     * @param pool the pool for which the position is created
     * @param tickLower the lower tick
     * @param tickUpper the upper tick
     * @param amount1 the desired amount of token1
     */
    static fromAmount1({ pool, tickLower, tickUpper, amount1 }: {
        pool: Pool;
        tickLower: number;
        tickUpper: number;
        amount1: BigintIsh;
    }): Position;
}
export {};
