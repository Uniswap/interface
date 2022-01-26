import { Token } from '@uniswap/sdk-core';
import { TokenInfo } from '@uniswap/token-lists';
import { useTokenBalances } from 'state/wallet/hooks';
/** Sorts tokens by currency amount (descending), then symbol (ascending). */
export declare function tokenComparator(balances: ReturnType<typeof useTokenBalances>, a: Token, b: Token): 1 | -1;
/** Sorts tokens by query, giving precedence to exact matches and partial matches. */
export declare function useSortTokensByQuery<T extends Token | TokenInfo>(query: string, tokens?: T[]): T[];
