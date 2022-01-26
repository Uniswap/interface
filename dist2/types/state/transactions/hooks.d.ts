import { TransactionResponse } from '@ethersproject/providers';
import { Token } from '@uniswap/sdk-core';
import { TransactionInfo } from './actions';
import { TransactionDetails } from './reducer';
export declare function useTransactionAdder(): (response: TransactionResponse, info: TransactionInfo) => void;
export declare function useAllTransactions(): {
    [txHash: string]: TransactionDetails;
};
export declare function useTransaction(transactionHash?: string): TransactionDetails | undefined;
export declare function useIsTransactionPending(transactionHash?: string): boolean;
export declare function useIsTransactionConfirmed(transactionHash?: string): boolean;
/**
 * Returns whether a transaction happened in the last day (86400 seconds * 1000 milliseconds / second)
 * @param tx to check for recency
 */
export declare function isTransactionRecent(tx: TransactionDetails): boolean;
export declare function useHasPendingApproval(token?: Token, spender?: string): boolean;
export declare function useUserHasSubmittedClaim(account?: string): {
    claimSubmitted: boolean;
    claimTxn: TransactionDetails | undefined;
};
