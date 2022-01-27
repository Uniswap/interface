import { BigNumber } from '@ethersproject/bignumber';
import { Trade } from '@uniswap/router-sdk';
import { Currency, Percent, TradeType } from '@uniswap/sdk-core';
import { Trade as V2Trade } from '@uniswap/v2-sdk';
import { Trade as V3Trade } from '@uniswap/v3-sdk';
import { SignatureData } from './useERC20Permit';
export declare type AnyTrade = V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | Trade<Currency, Currency, TradeType>;
interface SwapCall {
    address: string;
    calldata: string;
    value: string;
}
/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 * @param recipientAddressOrName the ENS name or address of the recipient of the swap output
 * @param signatureData the signature data of the permit of the input token amount, if available
 */
export declare function useSwapCallArguments(trade: AnyTrade | undefined, allowedSlippage: Percent, recipientAddressOrName: string | null | undefined, signatureData: SignatureData | null | undefined, deadline: BigNumber | undefined): SwapCall[];
export {};
