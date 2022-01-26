import { Currency, CurrencyAmount, Price, Token } from '@uniswap/sdk-core';
import { FeeAmount, Pool, Position } from '@uniswap/v3-sdk';
import { ReactNode } from 'react';
import { PoolState } from '../../../hooks/usePools';
import { AppState } from '../../index';
import { Bound, Field } from './actions';
export declare function useV3MintState(): AppState['mintV3'];
export declare function useV3MintActionHandlers(noLiquidity: boolean | undefined): {
    onFieldAInput: (typedValue: string) => void;
    onFieldBInput: (typedValue: string) => void;
    onLeftRangeInput: (typedValue: string) => void;
    onRightRangeInput: (typedValue: string) => void;
    onStartPriceInput: (typedValue: string) => void;
};
export declare function useV3DerivedMintInfo(currencyA?: Currency, currencyB?: Currency, feeAmount?: FeeAmount, baseCurrency?: Currency, existingPosition?: Position): {
    pool?: Pool | null;
    poolState: PoolState;
    ticks: {
        [bound in Bound]?: number | undefined;
    };
    price?: Price<Token, Token>;
    pricesAtTicks: {
        [bound in Bound]?: Price<Token, Token> | undefined;
    };
    currencies: {
        [field in Field]?: Currency;
    };
    currencyBalances: {
        [field in Field]?: CurrencyAmount<Currency>;
    };
    dependentField: Field;
    parsedAmounts: {
        [field in Field]?: CurrencyAmount<Currency>;
    };
    position: Position | undefined;
    noLiquidity?: boolean;
    errorMessage?: ReactNode;
    invalidPool: boolean;
    outOfRange: boolean;
    invalidRange: boolean;
    depositADisabled: boolean;
    depositBDisabled: boolean;
    invertPrice: boolean;
    ticksAtLimit: {
        [bound in Bound]?: boolean | undefined;
    };
};
export declare function useRangeHopCallbacks(baseCurrency: Currency | undefined, quoteCurrency: Currency | undefined, feeAmount: FeeAmount | undefined, tickLower: number | undefined, tickUpper: number | undefined, pool?: Pool | undefined | null): {
    getDecrementLower: () => string;
    getIncrementLower: () => string;
    getDecrementUpper: () => string;
    getIncrementUpper: () => string;
    getSetFullRange: () => void;
};
