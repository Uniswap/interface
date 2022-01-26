import { Currency } from '@uniswap/sdk-core';
import { FeeAmount, Pool } from '@uniswap/v3-sdk';
export declare enum PoolState {
    LOADING = 0,
    NOT_EXISTS = 1,
    EXISTS = 2,
    INVALID = 3
}
export declare function usePools(poolKeys: [Currency | undefined, Currency | undefined, FeeAmount | undefined][]): [PoolState, Pool | null][];
export declare function usePool(currencyA: Currency | undefined, currencyB: Currency | undefined, feeAmount: FeeAmount | undefined): [PoolState, Pool | null];
