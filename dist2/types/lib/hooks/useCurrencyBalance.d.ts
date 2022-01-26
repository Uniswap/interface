import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core';
/**
 * Returns a map of the given addresses to their eventually consistent ETH balances.
 */
export declare function useNativeCurrencyBalances(uncheckedAddresses?: (string | undefined)[]): {
    [address: string]: CurrencyAmount<Currency> | undefined;
};
/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
export declare function useTokenBalancesWithLoadingIndicator(address?: string, tokens?: (Token | undefined)[]): [{
    [tokenAddress: string]: CurrencyAmount<Token> | undefined;
}, boolean];
export declare function useTokenBalances(address?: string, tokens?: (Token | undefined)[]): {
    [tokenAddress: string]: CurrencyAmount<Token> | undefined;
};
export declare function useTokenBalance(account?: string, token?: Token): CurrencyAmount<Token> | undefined;
export declare function useCurrencyBalances(account?: string, currencies?: (Currency | undefined)[]): (CurrencyAmount<Currency> | undefined)[];
export default function useCurrencyBalance(account?: string, currency?: Currency): CurrencyAmount<Currency> | undefined;
