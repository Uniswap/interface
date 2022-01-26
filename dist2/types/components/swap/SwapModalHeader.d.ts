/// <reference types="react" />
import { Currency, Percent, TradeType } from '@uniswap/sdk-core';
import { InterfaceTrade } from 'state/routing/types';
export default function SwapModalHeader({ trade, allowedSlippage, recipient, showAcceptChanges, onAcceptChanges, }: {
    trade: InterfaceTrade<Currency, Currency, TradeType>;
    allowedSlippage: Percent;
    recipient: string | null;
    showAcceptChanges: boolean;
    onAcceptChanges: () => void;
}): JSX.Element;
