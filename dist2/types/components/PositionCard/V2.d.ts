/// <reference types="react" />
import { CurrencyAmount, Token } from '@uniswap/sdk-core';
import { Pair } from '@uniswap/v2-sdk';
interface PositionCardProps {
    pair: Pair;
    showUnwrapped?: boolean;
    border?: string;
    stakedBalance?: CurrencyAmount<Token>;
}
export default function V2PositionCard({ pair, border, stakedBalance }: PositionCardProps): JSX.Element;
export {};
