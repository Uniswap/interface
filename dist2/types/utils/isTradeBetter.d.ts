import { Currency, Percent, TradeType } from '@uniswap/sdk-core';
import { Trade as V2Trade } from '@uniswap/v2-sdk';
export declare function isTradeBetter(tradeA: V2Trade<Currency, Currency, TradeType> | undefined | null, tradeB: V2Trade<Currency, Currency, TradeType> | undefined | null, minimumDelta?: Percent): boolean | undefined;
