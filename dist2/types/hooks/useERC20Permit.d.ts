import { BigNumber } from '@ethersproject/bignumber';
import { Trade } from '@uniswap/router-sdk';
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core';
import { Trade as V2Trade } from '@uniswap/v2-sdk';
import { Trade as V3Trade } from '@uniswap/v3-sdk';
export declare enum PermitType {
    AMOUNT = 1,
    ALLOWED = 2
}
export interface PermitInfo {
    type: PermitType;
    name: string;
    version?: string;
}
export declare enum UseERC20PermitState {
    NOT_APPLICABLE = 0,
    LOADING = 1,
    NOT_SIGNED = 2,
    SIGNED = 3
}
interface BaseSignatureData {
    v: number;
    r: string;
    s: string;
    deadline: number;
    nonce: number;
    owner: string;
    spender: string;
    chainId: number;
    tokenAddress: string;
    permitType: PermitType;
}
interface StandardSignatureData extends BaseSignatureData {
    amount: string;
}
interface AllowedSignatureData extends BaseSignatureData {
    allowed: true;
}
export declare type SignatureData = StandardSignatureData | AllowedSignatureData;
export declare function useERC20Permit(currencyAmount: CurrencyAmount<Currency> | null | undefined, spender: string | null | undefined, transactionDeadline: BigNumber | undefined, overridePermitInfo: PermitInfo | undefined | null): {
    signatureData: SignatureData | null;
    state: UseERC20PermitState;
    gatherPermitSignature: null | (() => Promise<void>);
};
export declare function useERC20PermitFromTrade(trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | Trade<Currency, Currency, TradeType> | undefined, allowedSlippage: Percent, transactionDeadline: BigNumber | undefined): {
    signatureData: SignatureData | null;
    state: UseERC20PermitState;
    gatherPermitSignature: (() => Promise<void>) | null;
};
export {};
