/// <reference types="react" />
import { Trade } from '@uniswap/router-sdk';
import { Currency, Percent, TradeType } from '@uniswap/sdk-core';
import Summary from './Summary';
export default Summary;
interface SummaryDialogProps {
    trade: Trade<Currency, Currency, TradeType>;
    allowedSlippage: Percent;
    onConfirm: () => void;
}
export declare function SummaryDialog({ trade, allowedSlippage, onConfirm }: SummaryDialogProps): JSX.Element | null;
