/// <reference types="react" />
import { Trade } from '@uniswap/router-sdk';
import { Currency, Percent, TradeType } from '@uniswap/sdk-core';
interface DetailsProps {
    trade: Trade<Currency, Currency, TradeType>;
    allowedSlippage: Percent;
}
export default function Details({ trade, allowedSlippage }: DetailsProps): JSX.Element;
export {};
