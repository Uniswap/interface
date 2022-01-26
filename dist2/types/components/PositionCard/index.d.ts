/// <reference types="react" />
import { CurrencyAmount, Token } from '@uniswap/sdk-core';
import { Pair } from '@uniswap/v2-sdk';
export declare const FixedHeightRow: import("styled-components").StyledComponent<import("react").FunctionComponent<import("rebass").BoxProps>, import("styled-components").DefaultTheme, {
    width?: string | undefined;
    align?: string | undefined;
    justify?: string | undefined;
    padding?: string | undefined;
    border?: string | undefined;
    borderRadius?: string | undefined;
}, never>;
interface PositionCardProps {
    pair: Pair;
    showUnwrapped?: boolean;
    border?: string;
    stakedBalance?: CurrencyAmount<Token>;
}
export declare function MinimalPositionCard({ pair, showUnwrapped, border }: PositionCardProps): JSX.Element;
export default function FullPositionCard({ pair, border, stakedBalance }: PositionCardProps): JSX.Element;
export {};
