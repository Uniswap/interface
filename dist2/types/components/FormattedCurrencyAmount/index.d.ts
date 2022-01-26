/// <reference types="react" />
import { Currency, CurrencyAmount } from '@uniswap/sdk-core';
export default function FormattedCurrencyAmount({ currencyAmount, significantDigits, }: {
    currencyAmount: CurrencyAmount<Currency>;
    significantDigits?: number;
}): JSX.Element;
