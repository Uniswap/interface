import { Currency } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';
interface FeeTierDistribution {
    isLoading: boolean;
    isError: boolean;
    largestUsageFeeTier?: FeeAmount | undefined;
    distributions?: Record<FeeAmount, number | undefined>;
}
export declare function useFeeTierDistribution(currencyA: Currency | undefined, currencyB: Currency | undefined): FeeTierDistribution;
export {};
