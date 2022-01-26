/// <reference types="react" />
import { Currency, Percent, Price } from '@uniswap/sdk-core';
import { Field } from '../../state/mint/actions';
export declare function PoolPriceBar({ currencies, noLiquidity, poolTokenPercentage, price, }: {
    currencies: {
        [field in Field]?: Currency;
    };
    noLiquidity?: boolean;
    poolTokenPercentage?: Percent;
    price?: Price<Currency, Currency>;
}): JSX.Element;
