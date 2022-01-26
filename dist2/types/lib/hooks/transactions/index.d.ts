/// <reference types="react" />
import { Token } from '@uniswap/sdk-core';
import { Transaction, TransactionInfo } from 'lib/state/transactions';
export declare function usePendingTransactions(): {
    [hash: string]: Transaction<TransactionInfo>;
};
export declare function useAddTransaction(): (info: TransactionInfo) => void;
/** Returns the hash of a pending approval transaction, if it exists. */
export declare function usePendingApproval(token?: Token, spender?: string): string | undefined;
export declare function TransactionsUpdater(): JSX.Element;
