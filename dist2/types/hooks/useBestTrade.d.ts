import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core';
import { InterfaceTrade, TradeState } from 'state/routing/types';
/**
 * Returns the best v2+v3 trade for a desired swap.
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
export declare function useBestTrade(tradeType: TradeType, amountSpecified?: CurrencyAmount<Currency>, otherCurrency?: Currency): {
    state: TradeState;
    trade: InterfaceTrade<Currency, Currency, TradeType> | undefined;
};
