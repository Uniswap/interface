import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core';
import { Field } from 'lib/state/swap';
import { InterfaceTrade, TradeState } from 'state/routing/types';
interface SwapInfo {
    currencies: {
        [field in Field]?: Currency;
    };
    currencyBalances: {
        [field in Field]?: CurrencyAmount<Currency>;
    };
    currencyAmounts: {
        [field in Field]?: CurrencyAmount<Currency>;
    };
    trade: {
        trade?: InterfaceTrade<Currency, Currency, TradeType>;
        state: TradeState;
    };
    allowedSlippage: Percent;
}
export declare function SwapInfoUpdater(): null;
/** Requires that SwapInfoUpdater be installed in the DOM tree. **/
export default function useSwapInfo(): SwapInfo;
export {};
