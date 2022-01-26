import { Currency } from '@uniswap/sdk-core';
import { ReactNode } from 'react';
interface TokenInputProps {
    currency?: Currency;
    amount: string;
    disabled?: boolean;
    onMax?: () => void;
    onChangeInput: (input: string) => void;
    onChangeCurrency: (currency: Currency) => void;
    children: ReactNode;
}
export default function TokenInput({ currency, amount, disabled, onMax, onChangeInput, onChangeCurrency, children, }: TokenInputProps): JSX.Element;
export {};
