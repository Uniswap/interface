/// <reference types="react" />
import { Currency } from '@uniswap/sdk-core';
interface TokenBaseProps {
    value: Currency;
    onClick: (value: Currency) => void;
}
export default function TokenBase({ value, onClick }: TokenBaseProps): JSX.Element;
export {};
