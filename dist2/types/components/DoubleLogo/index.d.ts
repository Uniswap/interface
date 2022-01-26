/// <reference types="react" />
import { Currency } from '@uniswap/sdk-core';
interface DoubleCurrencyLogoProps {
    margin?: boolean;
    size?: number;
    currency0?: Currency;
    currency1?: Currency;
}
export default function DoubleCurrencyLogo({ currency0, currency1, size, margin, }: DoubleCurrencyLogoProps): JSX.Element;
export {};
