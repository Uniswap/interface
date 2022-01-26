import { Trade } from '@uniswap/router-sdk';
import { Currency, TradeType } from '@uniswap/sdk-core';
import { ReactNode } from 'react';
export default function SwapModalFooter({ onConfirm, swapErrorMessage, disabledConfirm, }: {
    trade: Trade<Currency, Currency, TradeType>;
    onConfirm: () => void;
    swapErrorMessage: ReactNode | undefined;
    disabledConfirm: boolean;
}): JSX.Element;
