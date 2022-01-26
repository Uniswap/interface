import { BigintIsh } from '@uniswap/sdk-core';
import { AlphaRouterConfig, ChainId } from '@uniswap/smart-order-router';
import { GetQuoteResult } from 'state/routing/types';
export declare function getQuote({ type, chainId, tokenIn, tokenOut, amount: amountRaw, }: {
    type: 'exactIn' | 'exactOut';
    chainId: ChainId;
    tokenIn: {
        address: string;
        chainId: number;
        decimals: number;
        symbol?: string;
    };
    tokenOut: {
        address: string;
        chainId: number;
        decimals: number;
        symbol?: string;
    };
    amount: BigintIsh;
}, alphaRouterConfig: Partial<AlphaRouterConfig>): Promise<{
    data: GetQuoteResult;
    error?: unknown;
}>;
