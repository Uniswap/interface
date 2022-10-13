import React from 'react';
import { QueryClient } from '../core';
import { ContextOptions } from '../reactjs/types';
declare global {
    interface Window {
        ReactQueryClientContext?: React.Context<QueryClient | undefined>;
    }
}
export declare const defaultContext: React.Context<QueryClient | undefined>;
export declare const useQueryClient: ({ context }?: ContextOptions) => QueryClient;
declare type QueryClientProviderPropsBase = {
    client: QueryClient;
    children?: React.ReactNode;
};
declare type QueryClientProviderPropsWithContext = ContextOptions & {
    contextSharing?: never;
} & QueryClientProviderPropsBase;
declare type QueryClientProviderPropsWithContextSharing = {
    context?: never;
    contextSharing?: boolean;
} & QueryClientProviderPropsBase;
export declare type QueryClientProviderProps = QueryClientProviderPropsWithContext | QueryClientProviderPropsWithContextSharing;
export declare const QueryClientProvider: ({ client, children, context, contextSharing, }: QueryClientProviderProps) => JSX.Element;
export {};
