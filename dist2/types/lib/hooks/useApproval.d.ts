import { TransactionResponse } from '@ethersproject/providers';
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core';
export declare enum ApprovalState {
    UNKNOWN = "UNKNOWN",
    NOT_APPROVED = "NOT_APPROVED",
    PENDING = "PENDING",
    APPROVED = "APPROVED"
}
export declare function useApprovalStateForSpender(amountToApprove: CurrencyAmount<Currency> | undefined, spender: string | undefined, useIsPendingApproval: (token?: Token, spender?: string) => boolean): ApprovalState;
export declare function useApproval(amountToApprove: CurrencyAmount<Currency> | undefined, spender: string | undefined, useIsPendingApproval: (token?: Token, spender?: string) => boolean): [
    ApprovalState,
    () => Promise<{
        response: TransactionResponse;
        tokenAddress: string;
        spenderAddress: string;
    } | undefined>
];
