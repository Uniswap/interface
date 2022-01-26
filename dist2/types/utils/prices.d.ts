import { Trade } from '@uniswap/router-sdk';
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core';
export declare function computeRealizedLPFeePercent(trade: Trade<Currency, Currency, TradeType>): Percent;
export declare function computeRealizedLPFeeAmount(trade?: Trade<Currency, Currency, TradeType> | null): CurrencyAmount<Currency> | undefined;
declare type WarningSeverity = 0 | 1 | 2 | 3 | 4;
export declare function warningSeverity(priceImpact: Percent | undefined): WarningSeverity;
export {};
