/// <reference types="react" />
import { FeeAmount } from '@uniswap/v3-sdk';
import { useFeeTierDistribution } from 'hooks/useFeeTierDistribution';
import { PoolState } from 'hooks/usePools';
export declare function FeeTierPercentageBadge({ feeAmount, distributions, poolState, }: {
    feeAmount: FeeAmount;
    distributions: ReturnType<typeof useFeeTierDistribution>['distributions'];
    poolState: PoolState;
}): JSX.Element;
