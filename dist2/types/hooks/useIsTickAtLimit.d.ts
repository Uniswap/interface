import { FeeAmount } from '@uniswap/v3-sdk';
export default function useIsTickAtLimit(feeAmount: FeeAmount | undefined, tickLower: number | undefined, tickUpper: number | undefined): {
    LOWER: boolean | undefined;
    UPPER: boolean | undefined;
};
