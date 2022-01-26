import { Currency, CurrencyAmount, Percent, Price, Token } from '@uniswap/sdk-core';
import { Pair } from '@uniswap/v2-sdk';
import { ReactNode } from 'react';
import { PairState } from '../../hooks/useV2Pairs';
import { AppState } from '../index';
import { Field } from './actions';
export declare function useMintState(): AppState['mint'];
export declare function useMintActionHandlers(noLiquidity: boolean | undefined): {
    onFieldAInput: (typedValue: string) => void;
    onFieldBInput: (typedValue: string) => void;
};
export declare function useDerivedMintInfo(currencyA: Currency | undefined, currencyB: Currency | undefined): {
    dependentField: Field;
    currencies: {
        [field in Field]?: Currency;
    };
    pair?: Pair | null;
    pairState: PairState;
    currencyBalances: {
        [field in Field]?: CurrencyAmount<Currency>;
    };
    parsedAmounts: {
        [field in Field]?: CurrencyAmount<Currency>;
    };
    price?: Price<Currency, Currency>;
    noLiquidity?: boolean;
    liquidityMinted?: CurrencyAmount<Token>;
    poolTokenPercentage?: Percent;
    error?: ReactNode;
};
