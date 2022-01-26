/// <reference types="react" />
import { Currency } from '@uniswap/sdk-core';
export default function RateToggle({ currencyA, currencyB, handleRateToggle, }: {
    currencyA: Currency;
    currencyB: Currency;
    handleRateToggle: () => void;
}): JSX.Element | null;
