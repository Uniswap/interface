/// <reference types="react" />
import { FeeAmount } from '@uniswap/v3-sdk';
import { useFeeTierDistribution } from 'hooks/useFeeTierDistribution';
import { PoolState } from 'hooks/usePools';
interface FeeOptionProps {
    feeAmount: FeeAmount;
    active: boolean;
    distributions: ReturnType<typeof useFeeTierDistribution>['distributions'];
    poolState: PoolState;
    onClick: () => void;
}
export declare function FeeOption({ feeAmount, active, poolState, distributions, onClick }: FeeOptionProps): JSX.Element;
export {};
