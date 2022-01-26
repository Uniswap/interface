import { CurrencyAmount, Percent, Token } from '@uniswap/sdk-core';
export declare function computeFiatValuePriceImpact(fiatValueInput: CurrencyAmount<Token> | undefined | null, fiatValueOutput: CurrencyAmount<Token> | undefined | null): Percent | undefined;
