/// <reference types="react" />
import { Currency, CurrencyAmount, Fraction, Percent } from '@uniswap/sdk-core';
import { Field } from '../../state/mint/actions';
export declare function ConfirmAddModalBottom({ noLiquidity, price, currencies, parsedAmounts, poolTokenPercentage, onAdd, }: {
    noLiquidity?: boolean;
    price?: Fraction;
    currencies: {
        [field in Field]?: Currency;
    };
    parsedAmounts: {
        [field in Field]?: CurrencyAmount<Currency>;
    };
    poolTokenPercentage?: Percent;
    onAdd: () => void;
}): JSX.Element;
