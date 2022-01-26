/// <reference types="react" />
import { Currency } from '@uniswap/sdk-core';
interface TokenSelectDialogProps {
    value?: Currency;
    onSelect: (token: Currency) => void;
}
export declare function TokenSelectDialog({ value, onSelect }: TokenSelectDialogProps): JSX.Element;
interface TokenSelectProps {
    value?: Currency;
    collapsed: boolean;
    disabled?: boolean;
    onSelect: (value: Currency) => void;
}
export default function TokenSelect({ value, collapsed, disabled, onSelect }: TokenSelectProps): JSX.Element;
export {};
