/// <reference types="react" />
import { Currency, TradeType } from '@uniswap/sdk-core';
import { InterfaceTrade } from 'state/routing/types';
export default function GasEstimateBadge({ trade, loading, showRoute, disableHover, }: {
    trade: InterfaceTrade<Currency, Currency, TradeType> | undefined | null;
    loading: boolean;
    showRoute?: boolean;
    disableHover?: boolean;
}): JSX.Element;
