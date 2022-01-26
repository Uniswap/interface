import multicall from 'lib/state/multicall';
import { SkipFirst } from 'types/tuple';
export type { CallStateResult } from '@uniswap/redux-multicall';
export { NEVER_RELOAD } from '@uniswap/redux-multicall';
declare type SkipFirstTwoParams<T extends (...args: any) => any> = SkipFirst<Parameters<T>, 2>;
export declare function useMultipleContractSingleData(...args: SkipFirstTwoParams<typeof multicall.hooks.useMultipleContractSingleData>): import("@uniswap/redux-multicall").CallState[];
export declare function useSingleCallResult(...args: SkipFirstTwoParams<typeof multicall.hooks.useSingleCallResult>): import("@uniswap/redux-multicall").CallState;
export declare function useSingleContractMultipleData(...args: SkipFirstTwoParams<typeof multicall.hooks.useSingleContractMultipleData>): import("@uniswap/redux-multicall").CallState[];
export declare function useSingleContractWithCallData(...args: SkipFirstTwoParams<typeof multicall.hooks.useSingleContractWithCallData>): import("@uniswap/redux-multicall").CallState[];
