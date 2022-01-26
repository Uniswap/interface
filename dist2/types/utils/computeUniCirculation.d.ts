import { BigNumber } from '@ethersproject/bignumber';
import { CurrencyAmount, Token } from '@uniswap/sdk-core';
export declare function computeUniCirculation(uni: Token, blockTimestamp: BigNumber, unclaimedUni: CurrencyAmount<Token> | undefined): CurrencyAmount<Token>;
