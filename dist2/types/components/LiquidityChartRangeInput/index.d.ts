/// <reference types="react" />
import { Currency, Price, Token } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';
import { Bound } from 'state/mint/v3/actions';
export default function LiquidityChartRangeInput({ currencyA, currencyB, feeAmount, ticksAtLimit, price, priceLower, priceUpper, onLeftRangeInput, onRightRangeInput, interactive, }: {
    currencyA: Currency | undefined;
    currencyB: Currency | undefined;
    feeAmount?: FeeAmount;
    ticksAtLimit: {
        [bound in Bound]?: boolean | undefined;
    };
    price: number | undefined;
    priceLower?: Price<Token, Token>;
    priceUpper?: Price<Token, Token>;
    onLeftRangeInput: (typedValue: string) => void;
    onRightRangeInput: (typedValue: string) => void;
    interactive: boolean;
}): JSX.Element;
