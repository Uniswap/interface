import { Currency, Token } from '@uniswap/sdk-core';
declare type ChainTokenList = {
    readonly [chainId: number]: Token[];
};
declare type ChainCurrencyList = {
    readonly [chainId: number]: Currency[];
};
export declare const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList;
export declare const ADDITIONAL_BASES: {
    [chainId: number]: {
        [tokenAddress: string]: Token[];
    };
};
/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export declare const CUSTOM_BASES: {
    [chainId: number]: {
        [tokenAddress: string]: Token[];
    };
};
/**
 * Shows up in the currency select for swap and add liquidity
 */
export declare const COMMON_BASES: ChainCurrencyList;
export declare const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList;
export declare const PINNED_PAIRS: {
    readonly [chainId: number]: [Token, Token][];
};
export {};
