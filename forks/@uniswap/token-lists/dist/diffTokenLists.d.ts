import { TokenInfo } from './types';
export declare type TokenInfoChangeKey = Exclude<keyof TokenInfo, 'address' | 'chainId'>;
export declare type TokenInfoChanges = Array<TokenInfoChangeKey>;
/**
 * Differences between a base list and an updated list.
 */
export interface TokenListDiff {
    /**
     * Tokens from updated with chainId/address not present in base list
     */
    readonly added: TokenInfo[];
    /**
     * Tokens from base with chainId/address not present in the updated list
     */
    readonly removed: TokenInfo[];
    /**
     * The token info that changed
     */
    readonly changed: {
        [chainId: number]: {
            [address: string]: TokenInfoChanges;
        };
    };
}
/**
 * Computes the diff of a token list where the first argument is the base and the second argument is the updated list.
 * @param base base list
 * @param update updated list
 */
export declare function diffTokenLists(base: TokenInfo[], update: TokenInfo[]): TokenListDiff;
