import { Currency } from '@uniswap/sdk-core';
/**
 * Returns true if the input currency or output currency cannot be traded in the interface
 * @param currencyIn the input currency to check
 * @param currencyOut the output currency to check
 */
export declare function useIsSwapUnsupported(currencyIn?: Currency | null, currencyOut?: Currency | null): boolean;
