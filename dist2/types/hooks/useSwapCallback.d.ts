import { Trade } from '@uniswap/router-sdk';
import { Currency, Percent, TradeType } from '@uniswap/sdk-core';
import { Trade as V2Trade } from '@uniswap/v2-sdk';
import { Trade as V3Trade } from '@uniswap/v3-sdk';
import { ReactNode } from 'react';
import { SignatureData } from './useERC20Permit';
declare type AnyTrade = V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | Trade<Currency, Currency, TradeType>;
declare enum SwapCallbackState {
    INVALID = 0,
    LOADING = 1,
    VALID = 2
}
export declare function useSwapCallback(trade: AnyTrade | undefined, // trade to execute, required
allowedSlippage: Percent, // in bips
recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
signatureData: SignatureData | undefined | null): {
    state: SwapCallbackState;
    callback: null | (() => Promise<string>);
    error: ReactNode | null;
};
export {};
