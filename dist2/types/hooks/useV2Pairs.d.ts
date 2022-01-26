import { Currency } from '@uniswap/sdk-core';
import { Pair } from '@uniswap/v2-sdk';
export declare enum PairState {
    LOADING = 0,
    NOT_EXISTS = 1,
    EXISTS = 2,
    INVALID = 3
}
export declare function useV2Pairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][];
export declare function useV2Pair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null];
