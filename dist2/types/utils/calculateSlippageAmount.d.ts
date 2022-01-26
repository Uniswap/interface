import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core';
import JSBI from 'jsbi';
export declare function calculateSlippageAmount(value: CurrencyAmount<Currency>, slippage: Percent): [JSBI, JSBI];
