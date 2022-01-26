import { TransactionReceipt, TransactionResponse } from '@ethersproject/abstract-provider';
import { TradeType } from '@uniswap/sdk-core';
export declare enum TransactionType {
    APPROVAL = 0,
    SWAP = 1
}
interface BaseTransactionInfo {
    type: TransactionType;
    response: TransactionResponse;
}
export interface ApprovalTransactionInfo extends BaseTransactionInfo {
    type: TransactionType.APPROVAL;
    tokenAddress: string;
    spenderAddress: string;
}
export interface SwapTransactionInfo extends BaseTransactionInfo {
    type: TransactionType.SWAP;
    tradeType: TradeType;
    inputCurrencyAddress: string;
    outputCurrencyAddress: string;
}
export interface InputSwapTransactionInfo extends SwapTransactionInfo {
    tradeType: TradeType.EXACT_INPUT;
    inputCurrencyAmount: string;
    expectedOutputCurrencyAmount: string;
    minimumOutputCurrencyAmount: string;
}
export interface OutputSwapTransactionInfo extends SwapTransactionInfo {
    tradeType: TradeType.EXACT_OUTPUT;
    outputCurrencyAmount: string;
    expectedInputCurrencyAmount: string;
    maximumInputCurrencyAmount: string;
}
export declare type TransactionInfo = ApprovalTransactionInfo | SwapTransactionInfo;
export interface Transaction<T extends TransactionInfo = TransactionInfo> {
    addedTime: number;
    lastCheckedBlockNumber?: number;
    receipt?: TransactionReceipt;
    info: T;
}
export declare const transactionsAtom: import("jotai").WritableAtom<{
    [chainId: string]: {
        [hash: string]: Transaction<TransactionInfo>;
    };
}, {
    [chainId: string]: {
        [hash: string]: Transaction<TransactionInfo>;
    };
} | ((draft: import("immer/dist/internal").WritableDraft<{
    [chainId: string]: {
        [hash: string]: Transaction<TransactionInfo>;
    };
}>) => void), void>;
export {};
