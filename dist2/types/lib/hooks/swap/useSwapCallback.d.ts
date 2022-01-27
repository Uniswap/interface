import { BigNumber } from '@ethersproject/bignumber';
import { TransactionResponse } from '@ethersproject/providers';
import { Percent } from '@uniswap/sdk-core';
import { SignatureData } from 'hooks/useERC20Permit';
import { AnyTrade } from 'hooks/useSwapCallArguments';
import { ReactNode } from 'react';
export declare enum SwapCallbackState {
    INVALID = 0,
    LOADING = 1,
    VALID = 2
}
export declare function useSwapCallback(trade: AnyTrade | undefined, // trade to execute, required
allowedSlippage: Percent, // in bips
recipientAddressOrName: string | null | undefined, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
signatureData: SignatureData | null | undefined, deadline: BigNumber | undefined): {
    state: SwapCallbackState;
    callback: null | (() => Promise<TransactionResponse>);
    error: ReactNode | null;
};
