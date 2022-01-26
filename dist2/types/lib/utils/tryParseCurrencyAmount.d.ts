import { Currency, CurrencyAmount } from '@uniswap/sdk-core';
/**
 * Parses a CurrencyAmount from the passed string.
 * Returns the CurrencyAmount, or undefined if parsing fails.
 */
export default function tryParseCurrencyAmount<T extends Currency>(value?: string, currency?: T): CurrencyAmount<T> | undefined;
