import { Currency, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core';
import { Pair } from '@uniswap/v2-sdk';
import { ReactNode } from 'react';
interface CurrencyInputPanelProps {
    value: string;
    onUserInput: (value: string) => void;
    onMax?: () => void;
    showMaxButton: boolean;
    label?: ReactNode;
    onCurrencySelect?: (currency: Currency) => void;
    currency?: Currency | null;
    hideBalance?: boolean;
    pair?: Pair | null;
    hideInput?: boolean;
    otherCurrency?: Currency | null;
    fiatValue?: CurrencyAmount<Token> | null;
    priceImpact?: Percent;
    id: string;
    showCommonBases?: boolean;
    showCurrencyAmount?: boolean;
    disableNonToken?: boolean;
    renderBalance?: (amount: CurrencyAmount<Currency>) => ReactNode;
    locked?: boolean;
    loading?: boolean;
}
export default function CurrencyInputPanel({ value, onUserInput, onMax, showMaxButton, onCurrencySelect, currency, otherCurrency, id, showCommonBases, showCurrencyAmount, disableNonToken, renderBalance, fiatValue, priceImpact, hideBalance, pair, // used for double token logo
hideInput, locked, loading, ...rest }: CurrencyInputPanelProps): JSX.Element;
export {};
