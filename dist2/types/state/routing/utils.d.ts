import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core';
import { Route as V2Route } from '@uniswap/v2-sdk';
import { Route as V3Route } from '@uniswap/v3-sdk';
import { GetQuoteResult, InterfaceTrade } from './types';
/**
 * Transforms a Routing API quote into an array of routes that can be used to create
 * a `Trade`.
 */
export declare function computeRoutes(currencyIn: Currency | undefined, currencyOut: Currency | undefined, tradeType: TradeType, quoteResult: Pick<GetQuoteResult, 'route'> | undefined): {
    routev3: V3Route<Token | import("@uniswap/sdk-core").NativeCurrency, Token | import("@uniswap/sdk-core").NativeCurrency> | null;
    routev2: V2Route<Token | import("@uniswap/sdk-core").NativeCurrency, Token | import("@uniswap/sdk-core").NativeCurrency> | null;
    inputAmount: CurrencyAmount<Token | import("@uniswap/sdk-core").NativeCurrency>;
    outputAmount: CurrencyAmount<Token | import("@uniswap/sdk-core").NativeCurrency>;
}[] | undefined;
export declare function transformRoutesToTrade<TTradeType extends TradeType>(route: ReturnType<typeof computeRoutes>, tradeType: TTradeType, gasUseEstimateUSD?: CurrencyAmount<Token> | null): InterfaceTrade<Currency, Currency, TTradeType>;
