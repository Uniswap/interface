import { Trade } from '@uniswap/router-sdk';
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core';
import { Trade as V2Trade } from '@uniswap/v2-sdk';
import { Trade as V3Trade } from '@uniswap/v3-sdk';
import { ApprovalState } from 'lib/hooks/useApproval';
export { ApprovalState } from 'lib/hooks/useApproval';
export declare function useApproveCallback(amountToApprove?: CurrencyAmount<Currency>, spender?: string): [ApprovalState, () => Promise<void>];
export declare function useApprovalOptimizedTrade(trade: Trade<Currency, Currency, TradeType> | undefined, allowedSlippage: Percent): V2Trade<Currency, Currency, TradeType> | Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined;
export declare function useApproveCallbackFromTrade(trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | Trade<Currency, Currency, TradeType> | undefined, allowedSlippage: Percent): [ApprovalState, () => Promise<void>];
