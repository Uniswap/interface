/// <reference types="react" />
import { Currency, Percent, TradeType } from '@uniswap/sdk-core';
import { InterfaceTrade } from 'state/routing/types';
interface AdvancedSwapDetailsProps {
    trade?: InterfaceTrade<Currency, Currency, TradeType>;
    allowedSlippage: Percent;
    syncing?: boolean;
    hideRouteDiagram?: boolean;
}
export declare function AdvancedSwapDetails({ trade, allowedSlippage, syncing }: AdvancedSwapDetailsProps): JSX.Element | null;
export {};
