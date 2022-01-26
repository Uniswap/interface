/// <reference types="react" />
import { Currency } from '@uniswap/sdk-core';
export default function UnsupportedCurrencyFooter({ show, currencies, }: {
    show: boolean;
    currencies: (Currency | undefined | null)[];
}): JSX.Element;
