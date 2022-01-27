import { CurrencyAmount, Token } from '@uniswap/sdk-core';
export declare function useV2LiquidityTokenPermit(liquidityAmount: CurrencyAmount<Token> | null | undefined, spender: string | null | undefined): {
    signatureData: import("./useERC20Permit").SignatureData | null;
    state: import("./useERC20Permit").UseERC20PermitState;
    gatherPermitSignature: (() => Promise<void>) | null;
};
