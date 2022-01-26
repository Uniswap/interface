import { CurrencyAmount, Token } from '@uniswap/sdk-core';
export { default as useCurrencyBalance, useCurrencyBalances, useNativeCurrencyBalances, useTokenBalance, useTokenBalances, useTokenBalancesWithLoadingIndicator, } from 'lib/hooks/useCurrencyBalance';
export declare function useAllTokenBalances(): {
    [tokenAddress: string]: CurrencyAmount<Token> | undefined;
};
export declare function useAggregateUniBalance(): CurrencyAmount<Token> | undefined;
