import { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { ChainId } from '@uniswap/smart-order-router';
import { GetQuoteResult } from './types';
export declare const routingApi: import("@reduxjs/toolkit/query/react").Api<import("@reduxjs/toolkit/query/react").BaseQueryFn<string | import("@reduxjs/toolkit/query/react").FetchArgs, unknown, FetchBaseQueryError, {}, import("@reduxjs/toolkit/query/react").FetchBaseQueryMeta>, {
    getQuote: import("@reduxjs/toolkit/query/react").QueryDefinition<{
        tokenInAddress: string;
        tokenInChainId: ChainId;
        tokenInDecimals: number;
        tokenInSymbol?: string | undefined;
        tokenOutAddress: string;
        tokenOutChainId: ChainId;
        tokenOutDecimals: number;
        tokenOutSymbol?: string | undefined;
        amount: string;
        useClientSideRouter: boolean;
        type: 'exactIn' | 'exactOut';
    }, import("@reduxjs/toolkit/query/react").BaseQueryFn<string | import("@reduxjs/toolkit/query/react").FetchArgs, unknown, FetchBaseQueryError, {}, import("@reduxjs/toolkit/query/react").FetchBaseQueryMeta>, never, GetQuoteResult, string>;
}, "routingApi", never, typeof import("@reduxjs/toolkit/dist/query/core/module").coreModuleName | typeof import("@reduxjs/toolkit/dist/query/react/module").reactHooksModuleName>;
export declare const useGetQuoteQuery: import("@reduxjs/toolkit/dist/query/react/buildHooks").UseQuery<import("@reduxjs/toolkit/query/react").QueryDefinition<{
    tokenInAddress: string;
    tokenInChainId: ChainId;
    tokenInDecimals: number;
    tokenInSymbol?: string | undefined;
    tokenOutAddress: string;
    tokenOutChainId: ChainId;
    tokenOutDecimals: number;
    tokenOutSymbol?: string | undefined;
    amount: string;
    useClientSideRouter: boolean;
    type: 'exactIn' | 'exactOut';
}, import("@reduxjs/toolkit/query/react").BaseQueryFn<string | import("@reduxjs/toolkit/query/react").FetchArgs, unknown, FetchBaseQueryError, {}, import("@reduxjs/toolkit/query/react").FetchBaseQueryMeta>, never, GetQuoteResult, string>>;
