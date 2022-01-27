import { TransactionResponse, Web3Provider } from '@ethersproject/providers';
import { Trade } from '@uniswap/router-sdk';
import { Currency, TradeType } from '@uniswap/sdk-core';
import { Trade as V2Trade } from '@uniswap/v2-sdk';
import { Trade as V3Trade } from '@uniswap/v3-sdk';
declare type AnyTrade = V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | Trade<Currency, Currency, TradeType>;
interface SwapCall {
    address: string;
    calldata: string;
    value: string;
}
export default function useSendSwapTransaction(account: string | null | undefined, chainId: number | undefined, library: Web3Provider | undefined, trade: AnyTrade | undefined, // trade to execute, required
swapCalls: SwapCall[]): {
    callback: null | (() => Promise<TransactionResponse>);
};
export {};
