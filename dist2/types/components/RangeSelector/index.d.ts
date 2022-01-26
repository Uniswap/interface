/// <reference types="react" />
import { Currency, Price, Token } from '@uniswap/sdk-core';
import { Bound } from 'state/mint/v3/actions';
export default function RangeSelector({ priceLower, priceUpper, onLeftRangeInput, onRightRangeInput, getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper, currencyA, currencyB, feeAmount, ticksAtLimit, }: {
    priceLower?: Price<Token, Token>;
    priceUpper?: Price<Token, Token>;
    getDecrementLower: () => string;
    getIncrementLower: () => string;
    getDecrementUpper: () => string;
    getIncrementUpper: () => string;
    onLeftRangeInput: (typedValue: string) => void;
    onRightRangeInput: (typedValue: string) => void;
    currencyA?: Currency | null;
    currencyB?: Currency | null;
    feeAmount?: number;
    ticksAtLimit: {
        [bound in Bound]?: boolean | undefined;
    };
}): JSX.Element;
