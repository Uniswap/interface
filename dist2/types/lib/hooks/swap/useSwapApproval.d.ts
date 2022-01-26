import { Trade } from '@uniswap/router-sdk';
import { Currency, Percent, Token, TradeType } from '@uniswap/sdk-core';
import { Trade as V2Trade } from '@uniswap/v2-sdk';
import { Trade as V3Trade } from '@uniswap/v3-sdk';
import { ApprovalState } from '../useApproval';
export { ApprovalState } from '../useApproval';
export declare function useSwapRouterAddress(trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | Trade<Currency, Currency, TradeType> | undefined): string | undefined;
export default function useSwapApproval(trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | Trade<Currency, Currency, TradeType> | undefined, allowedSlippage: Percent, useIsPendingApproval: (token?: Token, spender?: string) => boolean): [ApprovalState, () => Promise<{
    response: import("@ethersproject/abstract-provider").TransactionResponse;
    tokenAddress: string;
    spenderAddress: string;
} | undefined>];
export declare function useSwapApprovalOptimizedTrade(trade: Trade<Currency, Currency, TradeType> | undefined, allowedSlippage: Percent, useIsPendingApproval: (token?: Token, spender?: string) => boolean): V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | Trade<Currency, Currency, TradeType> | undefined;
