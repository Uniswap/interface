import { Currency, Token } from '@uniswap/sdk-core';
import { WrappedTokenInfo } from '../state/lists/wrappedTokenInfo';
export declare function useAllTokens(): {
    [address: string]: Token;
};
export declare function useUnsupportedTokens(): {
    [address: string]: Token;
};
export declare function useSearchInactiveTokenLists(search: string | undefined, minResults?: number): WrappedTokenInfo[];
export declare function useIsTokenActive(token: Token | undefined | null): boolean;
export declare function useIsUserAddedToken(currency: Currency | undefined | null): boolean;
export declare function useToken(tokenAddress?: string | null): Token | null | undefined;
export declare function useCurrency(currencyId?: string | null): Currency | null | undefined;
