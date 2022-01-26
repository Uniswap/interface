import { Currency, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core';
import { Pair } from '@uniswap/v2-sdk';
import { ReactNode } from 'react';
import { AppState } from '../index';
import { Field } from './actions';
export declare function useBurnState(): AppState['burn'];
export declare function useDerivedBurnInfo(currencyA: Currency | undefined, currencyB: Currency | undefined): {
    pair?: Pair | null;
    parsedAmounts: {
        [Field.LIQUIDITY_PERCENT]: Percent;
        [Field.LIQUIDITY]?: CurrencyAmount<Token>;
        [Field.CURRENCY_A]?: CurrencyAmount<Currency>;
        [Field.CURRENCY_B]?: CurrencyAmount<Currency>;
    };
    error?: ReactNode;
};
export declare function useBurnActionHandlers(): {
    onUserInput: (field: Field, typedValue: string) => void;
};
