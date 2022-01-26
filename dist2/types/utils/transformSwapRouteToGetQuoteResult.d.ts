import { Currency, CurrencyAmount } from '@uniswap/sdk-core';
import { SwapRoute } from '@uniswap/smart-order-router';
import { GetQuoteResult } from 'state/routing/types';
export declare function transformSwapRouteToGetQuoteResult(type: 'exactIn' | 'exactOut', amount: CurrencyAmount<Currency>, { quote, quoteGasAdjusted, route, estimatedGasUsed, estimatedGasUsedQuoteToken, estimatedGasUsedUSD, gasPriceWei, methodParameters, blockNumber, }: SwapRoute): GetQuoteResult;
