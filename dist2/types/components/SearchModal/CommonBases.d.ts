/// <reference types="react" />
import { Currency } from '@uniswap/sdk-core';
export default function CommonBases({ chainId, onSelect, selectedCurrency, }: {
    chainId?: number;
    selectedCurrency?: Currency | null;
    onSelect: (currency: Currency) => void;
}): JSX.Element | null;
