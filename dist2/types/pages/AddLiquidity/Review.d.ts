/// <reference types="react" />
import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core';
import { Position } from '@uniswap/v3-sdk';
import { Bound, Field } from '../../state/mint/v3/actions';
export declare function Review({ position, outOfRange, ticksAtLimit, }: {
    position?: Position;
    existingPosition?: Position;
    parsedAmounts: {
        [field in Field]?: CurrencyAmount<Currency>;
    };
    priceLower?: Price<Currency, Currency>;
    priceUpper?: Price<Currency, Currency>;
    outOfRange: boolean;
    ticksAtLimit: {
        [bound in Bound]?: boolean | undefined;
    };
}): JSX.Element;
