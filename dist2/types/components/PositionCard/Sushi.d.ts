/// <reference types="react" />
import { Token } from '@uniswap/sdk-core';
interface PositionCardProps {
    tokenA: Token;
    tokenB: Token;
    liquidityToken: Token;
    border?: string;
}
export default function SushiPositionCard({ tokenA, tokenB, liquidityToken, border }: PositionCardProps): JSX.Element;
export {};
