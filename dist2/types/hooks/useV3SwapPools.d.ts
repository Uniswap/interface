import { Currency } from '@uniswap/sdk-core';
import { Pool } from '@uniswap/v3-sdk';
/**
 * Returns all the existing pools that should be considered for swapping between an input currency and an output currency
 * @param currencyIn the input currency
 * @param currencyOut the output currency
 */
export declare function useV3SwapPools(currencyIn?: Currency, currencyOut?: Currency): {
    pools: Pool[];
    loading: boolean;
};
