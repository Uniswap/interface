import { Percent } from '@uniswap/sdk-core';
import { SwapCallbackState } from 'lib/hooks/swap/useSwapCallback';
import { ReactNode } from 'react';
import { SignatureData } from './useERC20Permit';
import { AnyTrade } from './useSwapCallArguments';
export declare function useSwapCallback(trade: AnyTrade | undefined, // trade to execute, required
allowedSlippage: Percent, // in bips
recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
signatureData: SignatureData | undefined | null): {
    state: SwapCallbackState;
    callback: null | (() => Promise<string>);
    error: ReactNode | null;
};
