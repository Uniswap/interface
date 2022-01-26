/// <reference types="react" />
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core';
import { InterfaceTrade } from 'state/routing/types';
/**
 * @returns Dropdown card for showing edge case warnings outside of button
 */
export default function SwapWarningDropdown({ fiatValueInput, trade, }: {
    fiatValueInput: CurrencyAmount<Token> | null;
    trade: InterfaceTrade<Currency, Currency, TradeType> | undefined;
}): JSX.Element | null;
