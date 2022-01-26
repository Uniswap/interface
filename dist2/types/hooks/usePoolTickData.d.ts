import { Currency } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';
import JSBI from 'jsbi';
export interface TickData {
    tick: number;
    liquidityNet: JSBI;
    liquidityGross: JSBI;
}
export interface TickProcessed {
    tick: number;
    liquidityActive: JSBI;
    liquidityNet: JSBI;
    price0: string;
}
export declare function usePoolActiveLiquidity(currencyA: Currency | undefined, currencyB: Currency | undefined, feeAmount: FeeAmount | undefined): {
    isLoading: boolean;
    isUninitialized: boolean;
    isError: boolean;
    error: any;
    activeTick: number | undefined;
    data: TickProcessed[] | undefined;
};
