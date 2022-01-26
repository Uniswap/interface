import { CurrencyAmount, Token } from '@uniswap/sdk-core';
import { Pair } from '@uniswap/v2-sdk';
import { ReactNode } from 'react';
export declare const STAKING_GENESIS = 1600387200;
export declare const REWARDS_DURATION_DAYS = 60;
export declare const STAKING_REWARDS_INFO: {
    [chainId: number]: {
        tokens: [Token, Token];
        stakingRewardAddress: string;
    }[];
};
export interface StakingInfo {
    stakingRewardAddress: string;
    tokens: [Token, Token];
    stakedAmount: CurrencyAmount<Token>;
    earnedAmount: CurrencyAmount<Token>;
    totalStakedAmount: CurrencyAmount<Token>;
    totalRewardRate: CurrencyAmount<Token>;
    rewardRate: CurrencyAmount<Token>;
    periodFinish: Date | undefined;
    active: boolean;
    getHypotheticalRewardRate: (stakedAmount: CurrencyAmount<Token>, totalStakedAmount: CurrencyAmount<Token>, totalRewardRate: CurrencyAmount<Token>) => CurrencyAmount<Token>;
}
export declare function useStakingInfo(pairToFilterBy?: Pair | null): StakingInfo[];
export declare function useTotalUniEarned(): CurrencyAmount<Token> | undefined;
export declare function useDerivedStakeInfo(typedValue: string, stakingToken: Token | undefined, userLiquidityUnstaked: CurrencyAmount<Token> | undefined): {
    parsedAmount?: CurrencyAmount<Token>;
    error?: ReactNode;
};
