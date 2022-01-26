import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core';
import { ParsedQs } from 'qs';
import { ReactNode } from 'react';
import { InterfaceTrade, TradeState } from 'state/routing/types';
import { AppState } from '../index';
import { Field } from './actions';
import { SwapState } from './reducer';
export declare function useSwapState(): AppState['swap'];
export declare function useSwapActionHandlers(): {
    onCurrencySelection: (field: Field, currency: Currency) => void;
    onSwitchTokens: () => void;
    onUserInput: (field: Field, typedValue: string) => void;
    onChangeRecipient: (recipient: string | null) => void;
};
export declare function useDerivedSwapInfo(): {
    currencies: {
        [field in Field]?: Currency | null;
    };
    currencyBalances: {
        [field in Field]?: CurrencyAmount<Currency>;
    };
    parsedAmount: CurrencyAmount<Currency> | undefined;
    inputError?: ReactNode;
    trade: {
        trade: InterfaceTrade<Currency, Currency, TradeType> | undefined;
        state: TradeState;
    };
    allowedSlippage: Percent;
};
export declare function queryParametersToSwapState(parsedQs: ParsedQs): SwapState;
export declare function useDefaultsFromURLSearch(): {
    inputCurrencyId: string | undefined;
    outputCurrencyId: string | undefined;
} | undefined;
