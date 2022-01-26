/// <reference types="react" />
import { Currency, Percent, TradeType } from '@uniswap/sdk-core';
import { InterfaceTrade } from 'state/routing/types';
interface SwapDetailsInlineProps {
    trade: InterfaceTrade<Currency, Currency, TradeType> | undefined;
    syncing: boolean;
    loading: boolean;
    showInverted: boolean;
    setShowInverted: React.Dispatch<React.SetStateAction<boolean>>;
    allowedSlippage: Percent;
}
export default function SwapDetailsDropdown({ trade, syncing, loading, showInverted, setShowInverted, allowedSlippage, }: SwapDetailsInlineProps): JSX.Element;
export {};
