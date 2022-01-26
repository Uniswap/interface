import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core';
import { Trade } from '@uniswap/v2-sdk';
/**
 * Returns the best v2 trade for a desired swap
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
export declare function useBestV2Trade(tradeType: TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT, amountSpecified?: CurrencyAmount<Currency>, otherCurrency?: Currency, { maxHops }?: {
    maxHops?: number | undefined;
}): Trade<Currency, Currency, TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT> | null;
