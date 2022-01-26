import { Currency, Token } from '@uniswap/sdk-core';
import { TokenMap } from './useTokenList';
/**
 * Returns a Token from the tokenAddress.
 * Returns null if token is loading or null was passed.
 * Returns undefined if tokenAddress is invalid or token does not exist.
 */
export declare function useTokenFromMap(tokens: TokenMap, tokenAddress?: string | null): Token | null | undefined;
/**
 * Returns a Token from the tokenAddress.
 * Returns null if token is loading or null was passed.
 * Returns undefined if tokenAddress is invalid or token does not exist.
 */
export declare function useToken(tokenAddress?: string | null): Token | null | undefined;
/**
 * Returns a Currency from the currencyId.
 * Returns null if currency is loading or null was passed.
 * Returns undefined if currencyId is invalid or token does not exist.
 */
export declare function useCurrencyFromMap(tokens: TokenMap, currencyId?: string | null): Currency | null | undefined;
/**
 * Returns a Currency from the currencyId.
 * Returns null if currency is loading or null was passed.
 * Returns undefined if currencyId is invalid or token does not exist.
 */
export default function useCurrency(currencyId?: string | null): Currency | null | undefined;
