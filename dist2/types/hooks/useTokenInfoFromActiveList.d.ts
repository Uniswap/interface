import { Currency } from '@uniswap/sdk-core';
/**
 * Returns a WrappedTokenInfo from the active token lists when possible,
 * or the passed token otherwise. */
export declare function useTokenInfoFromActiveList(currency: Currency): import("@uniswap/sdk-core").Token | import("@uniswap/sdk-core").NativeCurrency | import("../state/lists/wrappedTokenInfo").WrappedTokenInfo | undefined;
