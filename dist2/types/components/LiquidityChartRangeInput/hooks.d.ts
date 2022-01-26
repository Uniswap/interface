import { Currency } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';
import { ChartEntry } from './types';
export declare function useDensityChartData({ currencyA, currencyB, feeAmount, }: {
    currencyA: Currency | undefined;
    currencyB: Currency | undefined;
    feeAmount: FeeAmount | undefined;
}): {
    isLoading: boolean;
    isUninitialized: boolean;
    isError: boolean;
    error: any;
    formattedData: ChartEntry[] | undefined;
};
