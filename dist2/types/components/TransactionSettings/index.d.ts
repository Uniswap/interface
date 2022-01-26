/// <reference types="react" />
import { Percent } from '@uniswap/sdk-core';
interface TransactionSettingsProps {
    placeholderSlippage: Percent;
}
export default function TransactionSettings({ placeholderSlippage }: TransactionSettingsProps): JSX.Element;
export {};
