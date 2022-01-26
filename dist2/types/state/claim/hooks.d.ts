import { CurrencyAmount, Token } from '@uniswap/sdk-core';
interface UserClaimData {
    index: number;
    amount: string;
    proof: string[];
    flags?: {
        isSOCKS: boolean;
        isLP: boolean;
        isUser: boolean;
    };
}
export declare function useUserClaimData(account: string | null | undefined): UserClaimData | null;
export declare function useUserHasAvailableClaim(account: string | null | undefined): boolean;
export declare function useUserUnclaimedAmount(account: string | null | undefined): CurrencyAmount<Token> | undefined;
export declare function useClaimCallback(account: string | null | undefined): {
    claimCallback: () => Promise<string>;
};
export {};
