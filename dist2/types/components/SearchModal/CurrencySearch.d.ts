/// <reference types="react" />
import { Currency, Token } from '@uniswap/sdk-core';
interface CurrencySearchProps {
    isOpen: boolean;
    onDismiss: () => void;
    selectedCurrency?: Currency | null;
    onCurrencySelect: (currency: Currency) => void;
    otherSelectedCurrency?: Currency | null;
    showCommonBases?: boolean;
    showCurrencyAmount?: boolean;
    disableNonToken?: boolean;
    showManageView: () => void;
    showImportView: () => void;
    setImportToken: (token: Token) => void;
}
export declare function CurrencySearch({ selectedCurrency, onCurrencySelect, otherSelectedCurrency, showCommonBases, showCurrencyAmount, disableNonToken, onDismiss, isOpen, showManageView, showImportView, setImportToken, }: CurrencySearchProps): JSX.Element;
export {};
