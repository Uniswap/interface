import { BigintIsh, ChainId, Price, Token, CurrencyAmount } from '@uniswap/sdk-core';
import JSBI from 'jsbi';
import { FeeAmount } from '../constants';
import { Tick, TickConstructorArgs } from './tick';
import { TickDataProvider } from './tickDataProvider';
/**
 * Represents a V3 pool
 */
export declare class Pool {
    readonly token0: Token;
    readonly token1: Token;
    readonly fee: FeeAmount;
    readonly sqrtRatioX96: JSBI;
    readonly liquidity: JSBI;
    readonly tickCurrent: number;
    readonly tickDataProvider: TickDataProvider;
    private _token0Price?;
    private _token1Price?;
    static getAddress(tokenA: Token, tokenB: Token, fee: FeeAmount): string;
    /**
     * Construct a pool
     * @param tokenA one of the tokens in the pool
     * @param tokenB the other token in the pool
     * @param fee the fee in hundredths of a bips of the input amount of every swap that is collected by the pool
     * @param sqrtRatioX96 the sqrt of the current ratio of amounts of token1 to token0
     * @param liquidity the current value of in range liquidity
     * @param tickCurrent the current tick of the pool
     * @param ticks the current state of the pool ticks or a data provider that can return tick data
     */
    constructor(tokenA: Token, tokenB: Token, fee: FeeAmount, sqrtRatioX96: BigintIsh, liquidity: BigintIsh, tickCurrent: number, ticks?: TickDataProvider | (Tick | TickConstructorArgs)[]);
    /**
     * Returns true if the token is either token0 or token1
     * @param token to check
     */
    involvesToken(token: Token): boolean;
    /**
     * Returns the current mid price of the pool in terms of token0, i.e. the ratio of token1 over token0
     */
    get token0Price(): Price<Token, Token>;
    /**
     * Returns the current mid price of the pool in terms of token1, i.e. the ratio of token0 over token1
     */
    get token1Price(): Price<Token, Token>;
    /**
     * Return the price of the given token in terms of the other token in the pool.
     * @param token token to return price of
     */
    priceOf(token: Token): Price<Token, Token>;
    /**
     * Returns the chain ID of the tokens in the pool.
     */
    get chainId(): ChainId | number;
    /**
     * Given an input amount of a token, return the computed output amount and a pool with state updated after the trade
     * @param inputAmount the input amount for which to quote the output amount
     */
    getOutputAmount(inputAmount: CurrencyAmount<Token>, sqrtPriceLimitX96?: JSBI): Promise<[CurrencyAmount<Token>, Pool]>;
    /**
     * Given a desired output amount of a token, return the computed input amount and a pool with state updated after the trade
     * @param outputAmount the output amount for which to quote the input amount
     */
    getInputAmount(outputAmount: CurrencyAmount<Token>, sqrtPriceLimitX96?: JSBI): Promise<[CurrencyAmount<Token>, Pool]>;
    private swap;
    get tickSpacing(): number;
}
