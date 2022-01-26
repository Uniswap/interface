import { Currency, Token } from '@uniswap/sdk-core';
import { MutableRefObject } from 'react';
import { FixedSizeList } from 'react-window';
import { WrappedTokenInfo } from '../../state/lists/wrappedTokenInfo';
export default function CurrencyList({ height, currencies, otherListTokens, selectedCurrency, onCurrencySelect, otherCurrency, fixedListRef, showImportView, setImportToken, showCurrencyAmount, }: {
    height: number;
    currencies: Currency[];
    otherListTokens?: WrappedTokenInfo[];
    selectedCurrency?: Currency | null;
    onCurrencySelect: (currency: Currency) => void;
    otherCurrency?: Currency | null;
    fixedListRef?: MutableRefObject<FixedSizeList | undefined>;
    showImportView: () => void;
    setImportToken: (token: Token) => void;
    showCurrencyAmount?: boolean;
}): JSX.Element;
