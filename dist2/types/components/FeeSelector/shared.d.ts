import { FeeAmount } from '@uniswap/v3-sdk';
import { SupportedChainId } from 'constants/chains';
import { ReactNode } from 'react';
export declare const FEE_AMOUNT_DETAIL: Record<FeeAmount, {
    label: string;
    description: ReactNode;
    supportedChains: SupportedChainId[];
}>;
