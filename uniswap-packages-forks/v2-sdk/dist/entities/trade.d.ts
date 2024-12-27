import { Currency, CurrencyAmount, Percent, Price, TradeType } from '@uniswap/sdk-core';
import { Pair } from './pair';
import { Route } from './route';
interface InputOutput<TInput extends Currency, TOutput extends Currency> {
    readonly inputAmount: CurrencyAmount<TInput>;
    readonly outputAmount: CurrencyAmount<TOutput>;
}
export declare function inputOutputComparator<TInput extends Currency, TOutput extends Currency>(a: InputOutput<TInput, TOutput>, b: InputOutput<TInput, TOutput>): number;
export declare function tradeComparator<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType>(a: Trade<TInput, TOutput, TTradeType>, b: Trade<TInput, TOutput, TTradeType>): number;
export interface BestTradeOptions {
    maxNumResults?: number;
    maxHops?: number;
}
/**
 * Represents a trade executed against a list of pairs.
 * Does not account for slippage, i.e. trades that front run this trade and move the price.
 */
export declare class Trade<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType> {
    /**
     * The route of the trade, i.e. which pairs the trade goes through and the input/output currencies.
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
     * The price expressed in terms of output amount/input amount.
     */
    readonly executionPrice: Price<TInput, TOutput>;
    /**
     * The percent difference between the mid price before the trade and the trade execution price.
     */
    readonly priceImpact: Percent;
    /**
     * Constructs an exact in trade with the given amount in and route
     * @param route route of the exact in trade
     * @param amountIn the amount being passed in
     */
    static exactIn<TInput extends Currency, TOutput extends Currency>(route: Route<TInput, TOutput>, amountIn: CurrencyAmount<TInput>): Trade<TInput, TOutput, TradeType.EXACT_INPUT>;
    /**
     * Constructs an exact out trade with the given amount out and route
     * @param route route of the exact out trade
     * @param amountOut the amount returned by the trade
     */
    static exactOut<TInput extends Currency, TOutput extends Currency>(route: Route<TInput, TOutput>, amountOut: CurrencyAmount<TOutput>): Trade<TInput, TOutput, TradeType.EXACT_OUTPUT>;
    constructor(route: Route<TInput, TOutput>, amount: TTradeType extends TradeType.EXACT_INPUT ? CurrencyAmount<TInput> : CurrencyAmount<TOutput>, tradeType: TTradeType);
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
     * Given a list of pairs, and a fixed amount in, returns the top `maxNumResults` trades that go from an input token
     * amount to an output token, making at most `maxHops` hops.
     * Note this does not consider aggregation, as routes are linear. It's possible a better route exists by splitting
     * the amount in among multiple routes.
     * @param pairs the pairs to consider in finding the best trade
     * @param nextAmountIn exact amount of input currency to spend
     * @param currencyOut the desired currency out
     * @param maxNumResults maximum number of results to return
     * @param maxHops maximum number of hops a returned trade can make, e.g. 1 hop goes through a single pair
     * @param currentPairs used in recursion; the current list of pairs
     * @param currencyAmountIn used in recursion; the original value of the currencyAmountIn parameter
     * @param bestTrades used in recursion; the current list of best trades
     */
    static bestTradeExactIn<TInput extends Currency, TOutput extends Currency>(pairs: Pair[], currencyAmountIn: CurrencyAmount<TInput>, currencyOut: TOutput, { maxNumResults, maxHops }?: BestTradeOptions, currentPairs?: Pair[], nextAmountIn?: CurrencyAmount<Currency>, bestTrades?: Trade<TInput, TOutput, TradeType.EXACT_INPUT>[]): Trade<TInput, TOutput, TradeType.EXACT_INPUT>[];
    /**
     * Return the execution price after accounting for slippage tolerance
     * @param slippageTolerance the allowed tolerated slippage
     */
    worstExecutionPrice(slippageTolerance: Percent): Price<TInput, TOutput>;
    /**
     * similar to the above method but instead targets a fixed output amount
     * given a list of pairs, and a fixed amount out, returns the top `maxNumResults` trades that go from an input token
     * to an output token amount, making at most `maxHops` hops
     * note this does not consider aggregation, as routes are linear. it's possible a better route exists by splitting
     * the amount in among multiple routes.
     * @param pairs the pairs to consider in finding the best trade
     * @param currencyIn the currency to spend
     * @param nextAmountOut the exact amount of currency out
     * @param maxNumResults maximum number of results to return
     * @param maxHops maximum number of hops a returned trade can make, e.g. 1 hop goes through a single pair
     * @param currentPairs used in recursion; the current list of pairs
     * @param currencyAmountOut used in recursion; the original value of the currencyAmountOut parameter
     * @param bestTrades used in recursion; the current list of best trades
     */
    static bestTradeExactOut<TInput extends Currency, TOutput extends Currency>(pairs: Pair[], currencyIn: TInput, currencyAmountOut: CurrencyAmount<TOutput>, { maxNumResults, maxHops }?: BestTradeOptions, currentPairs?: Pair[], nextAmountOut?: CurrencyAmount<Currency>, bestTrades?: Trade<TInput, TOutput, TradeType.EXACT_OUTPUT>[]): Trade<TInput, TOutput, TradeType.EXACT_OUTPUT>[];
}
export {};
