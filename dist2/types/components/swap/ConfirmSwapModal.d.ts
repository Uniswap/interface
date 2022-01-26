import { Trade } from '@uniswap/router-sdk';
import { Currency, Percent, TradeType } from '@uniswap/sdk-core';
import { ReactNode } from 'react';
import { InterfaceTrade } from 'state/routing/types';
export default function ConfirmSwapModal({ trade, originalTrade, onAcceptChanges, allowedSlippage, onConfirm, onDismiss, recipient, swapErrorMessage, isOpen, attemptingTxn, txHash, }: {
    isOpen: boolean;
    trade: InterfaceTrade<Currency, Currency, TradeType> | undefined;
    originalTrade: Trade<Currency, Currency, TradeType> | undefined;
    attemptingTxn: boolean;
    txHash: string | undefined;
    recipient: string | null;
    allowedSlippage: Percent;
    onAcceptChanges: () => void;
    onConfirm: () => void;
    swapErrorMessage: ReactNode | undefined;
    onDismiss: () => void;
}): JSX.Element;
