import { Price, Token } from '@uniswap/sdk-core';
export declare function getTickToPrice(baseToken?: Token, quoteToken?: Token, tick?: number): Price<Token, Token> | undefined;
