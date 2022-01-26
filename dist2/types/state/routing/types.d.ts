import { Trade } from '@uniswap/router-sdk';
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core';
import { Route as V2Route } from '@uniswap/v2-sdk';
import { Route as V3Route } from '@uniswap/v3-sdk';
export declare enum TradeState {
    LOADING = 0,
    INVALID = 1,
    NO_ROUTE_FOUND = 2,
    VALID = 3,
    SYNCING = 4
}
export declare type TokenInRoute = Pick<Token, 'address' | 'chainId' | 'symbol' | 'decimals'>;
export declare type V3PoolInRoute = {
    type: 'v3-pool';
    tokenIn: TokenInRoute;
    tokenOut: TokenInRoute;
    sqrtRatioX96: string;
    liquidity: string;
    tickCurrent: string;
    fee: string;
    amountIn?: string;
    amountOut?: string;
    address?: string;
};
export declare type V2Reserve = {
    token: TokenInRoute;
    quotient: string;
};
export declare type V2PoolInRoute = {
    type: 'v2-pool';
    tokenIn: TokenInRoute;
    tokenOut: TokenInRoute;
    reserve0: V2Reserve;
    reserve1: V2Reserve;
    amountIn?: string;
    amountOut?: string;
    address?: string;
};
export interface GetQuoteResult {
    quoteId?: string;
    blockNumber: string;
    amount: string;
    amountDecimals: string;
    gasPriceWei: string;
    gasUseEstimate: string;
    gasUseEstimateQuote: string;
    gasUseEstimateQuoteDecimals: string;
    gasUseEstimateUSD: string;
    methodParameters?: {
        calldata: string;
        value: string;
    };
    quote: string;
    quoteDecimals: string;
    quoteGasAdjusted: string;
    quoteGasAdjustedDecimals: string;
    route: Array<V3PoolInRoute[] | V2PoolInRoute[]>;
    routeString: string;
}
export declare class InterfaceTrade<TInput extends Currency, TOutput extends Currency, TTradeType extends TradeType> extends Trade<TInput, TOutput, TTradeType> {
    gasUseEstimateUSD: CurrencyAmount<Token> | null | undefined;
    constructor({ gasUseEstimateUSD, ...routes }: {
        gasUseEstimateUSD?: CurrencyAmount<Token> | undefined | null;
        v2Routes: {
            routev2: V2Route<TInput, TOutput>;
            inputAmount: CurrencyAmount<TInput>;
            outputAmount: CurrencyAmount<TOutput>;
        }[];
        v3Routes: {
            routev3: V3Route<TInput, TOutput>;
            inputAmount: CurrencyAmount<TInput>;
            outputAmount: CurrencyAmount<TOutput>;
        }[];
        tradeType: TTradeType;
    });
}
