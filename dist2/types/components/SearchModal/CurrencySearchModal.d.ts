/// <reference types="react" />
import { Currency } from '@uniswap/sdk-core';
interface CurrencySearchModalProps {
    isOpen: boolean;
    onDismiss: () => void;
    selectedCurrency?: Currency | null;
    onCurrencySelect: (currency: Currency) => void;
    otherSelectedCurrency?: Currency | null;
    showCommonBases?: boolean;
    showCurrencyAmount?: boolean;
    disableNonToken?: boolean;
}
export declare enum CurrencyModalView {
    search = 0,
    manage = 1,
    importToken = 2,
    importList = 3
}
export default function CurrencySearchModal({ isOpen, onDismiss, onCurrencySelect, selectedCurrency, otherSelectedCurrency, showCommonBases, showCurrencyAmount, disableNonToken, }: CurrencySearchModalProps): JSX.Element;
export {};
