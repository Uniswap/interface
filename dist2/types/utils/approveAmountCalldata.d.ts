import { Currency, CurrencyAmount } from '@uniswap/sdk-core';
export default function approveAmountCalldata(amount: CurrencyAmount<Currency>, spender: string): {
    to: string;
    data: string;
    value: '0x0';
};
