import { Currency } from '@uniswap/sdk-core';
import { Route } from '@uniswap/v3-sdk';
/**
 * Returns all the routes from an input currency to an output currency
 * @param currencyIn the input currency
 * @param currencyOut the output currency
 */
export declare function useAllV3Routes(currencyIn?: Currency, currencyOut?: Currency): {
    loading: boolean;
    routes: Route<Currency, Currency>[];
};
