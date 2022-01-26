import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core';
export declare function formatCurrencyAmount(amount: CurrencyAmount<Currency> | undefined, sigFigs: number): string;
export declare function formatPrice(price: Price<Currency, Currency> | undefined, sigFigs: number): string;
