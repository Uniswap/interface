import { Price, Token } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';
export declare function tryParsePrice(baseToken?: Token, quoteToken?: Token, value?: string): Price<Token, Token> | undefined;
export declare function tryParseTick(baseToken?: Token, quoteToken?: Token, feeAmount?: FeeAmount, value?: string): number | undefined;
