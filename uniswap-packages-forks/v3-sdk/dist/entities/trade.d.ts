import { Currency, Percent, Price, CurrencyAmount, TradeType } from '@uniswap/sdk-core';
import { Pool } from './pool';
import { Route } from './route';
export declare function tradeComparator<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType>(a: Trade<TInput, TOutput, TTradeType>, b: Trade<TInput, TOutput, TTradeType>): number;
export interface BestTradeOptions {
    maxNumResults?: number;
    maxHops?: number;
}
/**
 * Represents a trade executed against a list of pools.
 * Does not account for slippage, i.e. trades that front run this trade and move the price.
 */
export declare class Trade<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType> {
    /**
     * The route of the trade, i.e. which pools the trade goes through.
     */
    readonly route: Route<TInput, TOutput>;
    /**
     * The type of the trade, either exact in or exact out.
     */
    readonly tradeType: TTradeType;
    /**
     * The input amount for the trade assuming no slippage.
     */
    readonly inputAmount: CurrencyAmount<TInput>;
    /**
     * The output amount for the trade assuming no slippage.
     */
    readonly outputAmount: CurrencyAmount<TOutput>;
    /**
     * The cached result of the computed execution price
     * @private
     */
    private _executionPrice;
    /**
     * The price expressed in terms of output amount/input amount.
     */
    get executionPrice(): Price<TInput, TOutput>;
    /**
     * The cached result of the price impact computation
     * @private
     */
    private _priceImpact;
    /**
     * Returns the percent difference between the route's mid price and the price impact
     */
    get priceImpact(): Percent;
    /**
     * Constructs an exact in trade with the given amount in and route
     * @param route route of the exact in trade
     * @param amountIn the amount being passed in
     */
    static exactIn<TInput extends Currency, TOutput extends Currency>(route: Route<TInput, TOutput>, amountIn: CurrencyAmount<TInput>): Promise<Trade<TInput, TOutput, TradeType.EXACT_INPUT>>;
    /**
     * Constructs an exact out trade with the given amount out and route
     * @param route route of the exact out trade
     * @param amountOut the amount returned by the trade
     */
    static exactOut<TInput extends Currency, TOutput extends Currency>(route: Route<TInput, TOutput>, amountOut: CurrencyAmount<TOutput>): Promise<Trade<TInput, TOutput, TradeType.EXACT_OUTPUT>>;
    /**
     * Constructs a trade by simulating swaps through the given route
     * @param route route to swap through
     * @param amount the amount specified, either input or output, depending on tradeType
     * @param tradeType whether the trade is an exact input or exact output swap
     */
    static fromRoute<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType>(route: Route<TInput, TOutput>, amount: TTradeType extends TradeType.EXACT_INPUT ? CurrencyAmount<TInput> : CurrencyAmount<TOutput>, tradeType: TTradeType): Promise<Trade<TInput, TOutput, TTradeType>>;
    /**
     * Creates a trade without computing the result of swapping through the route. Useful when you have simulated the trade
     * elsewhere and do not have any tick data
     * @param constructorArguments the arguments passed to the trade constructor
     */
    static createUncheckedTrade<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType>(constructorArguments: {
        route: Route<TInput, TOutput>;
        inputAmount: CurrencyAmount<TInput>;
        outputAmount: CurrencyAmount<TOutput>;
        tradeType: TTradeType;
    }): Trade<TInput, TOutput, TTradeType>;
    /**
     * Construct a trade by passing in the pre-computed property values
     * @param route the route through which the trade occurs
     * @param inputAmount the amount of input paid in the trade
     * @param outputAmount the amount of output received in the trade
     * @param tradeType the type of trade, exact input or exact output
     */
    private constructor();
    /**
     * Get the minimum amount that must be received from this trade for the given slippage tolerance
     * @param slippageTolerance tolerance of unfavorable slippage from the execution price of this trade
     */
    minimumAmountOut(slippageTolerance: Percent): CurrencyAmount<TOutput>;
    /**
     * Get the maximum amount in that can be spent via this trade for the given slippage tolerance
     * @param slippageTolerance tolerance of unfavorable slippage from the execution price of this trade
     */
    maximumAmountIn(slippageTolerance: Percent): CurrencyAmount<TInput>;
    /**
     * Return the execution price after accounting for slippage tolerance
     * @param slippageTolerance the allowed tolerated slippage
     */
    worstExecutionPrice(slippageTolerance: Percent): Price<TInput, TOutput>;
    /**
     * Given a list of pools, and a fixed amount in, returns the top `maxNumResults` trades that go from an input token
     * amount to an output token, making at most `maxHops` hops.
     * Note this does not consider aggregation, as routes are linear. It's possible a better route exists by splitting
     * the amount in among multiple routes.
     * @param pools the pools to consider in finding the best trade
     * @param nextAmountIn exact amount of input currency to spend
     * @param currencyOut the desired currency out
     * @param maxNumResults maximum number of results to return
     * @param maxHops maximum number of hops a returned trade can make, e.g. 1 hop goes through a single pool
     * @param currentPools used in recursion; the current list of pools
     * @param currencyAmountIn used in recursion; the original value of the currencyAmountIn parameter
     * @param bestTrades used in recursion; the current list of best trades
     */
    static bestTradeExactIn<TInput extends Currency, TOutput extends Currency>(pools: Pool[], currencyAmountIn: CurrencyAmount<TInput>, currencyOut: TOutput, { maxNumResults, maxHops }?: BestTradeOptions, currentPools?: Pool[], nextAmountIn?: CurrencyAmount<Currency>, bestTrades?: Trade<TInput, TOutput, TradeType.EXACT_INPUT>[]): Promise<Trade<TInput, TOutput, TradeType.EXACT_INPUT>[]>;
    /**
     * similar to the above method but instead targets a fixed output amount
     * given a list of pools, and a fixed amount out, returns the top `maxNumResults` trades that go from an input token
     * to an output token amount, making at most `maxHops` hops
     * note this does not consider aggregation, as routes are linear. it's possible a better route exists by splitting
     * the amount in among multiple routes.
     * @param pools the pools to consider in finding the best trade
     * @param currencyIn the currency to spend
     * @param currencyAmountOut the desired currency amount out
     * @param nextAmountOut the exact amount of currency out
     * @param maxNumResults maximum number of results to return
     * @param maxHops maximum number of hops a returned trade can make, e.g. 1 hop goes through a single pool
     * @param currentPools used in recursion; the current list of pools
     * @param bestTrades used in recursion; the current list of best trades
     */
    static bestTradeExactOut<TInput extends Currency, TOutput extends Currency>(pools: Pool[], currencyIn: Currency, currencyAmountOut: CurrencyAmount<TOutput>, { maxNumResults, maxHops }?: BestTradeOptions, currentPools?: Pool[], nextAmountOut?: CurrencyAmount<Currency>, bestTrades?: Trade<TInput, TOutput, TradeType.EXACT_OUTPUT>[]): Promise<Trade<TInput, TOutput, TradeType.EXACT_OUTPUT>[]>;
}
