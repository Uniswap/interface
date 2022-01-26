/// <reference types="react" />
import { Currency } from '@uniswap/sdk-core';
interface TokenButtonProps {
    value?: Currency;
    collapsed: boolean;
    disabled?: boolean;
    onClick: () => void;
}
export default function TokenButton({ value, collapsed, disabled, onClick }: TokenButtonProps): JSX.Element;
export {};
