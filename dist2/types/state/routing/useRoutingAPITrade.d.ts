import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core';
import { InterfaceTrade, TradeState } from './types';
/**
 * Returns the best trade by invoking the routing api or the smart order router on the client
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
export declare function useRoutingAPITrade<TTradeType extends TradeType>(tradeType: TTradeType, amountSpecified?: CurrencyAmount<Currency>, otherCurrency?: Currency): {
    state: TradeState;
    trade: InterfaceTrade<Currency, Currency, TTradeType> | undefined;
};
