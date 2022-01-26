/// <reference types="react" />
import { Currency, CurrencyAmount } from '@uniswap/sdk-core';
interface SummaryProps {
    input: CurrencyAmount<Currency>;
    output: CurrencyAmount<Currency>;
    usdc?: boolean;
}
export default function Summary({ input, output, usdc }: SummaryProps): JSX.Element;
export {};
