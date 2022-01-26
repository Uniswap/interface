/// <reference types="react" />
import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core';
export declare function FiatValue({ fiatValue, priceImpact, }: {
    fiatValue: CurrencyAmount<Currency> | null | undefined;
    priceImpact?: Percent;
}): JSX.Element;
