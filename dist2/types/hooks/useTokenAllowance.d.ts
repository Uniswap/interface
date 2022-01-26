import { CurrencyAmount, Token } from '@uniswap/sdk-core';
export declare function useTokenAllowance(token?: Token, owner?: string, spender?: string): CurrencyAmount<Token> | undefined;
