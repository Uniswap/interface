import { Currency, Token } from '@uniswap/sdk-core';
import { Tags, TokenInfo, TokenList } from '@uniswap/token-lists';
declare type TagDetails = Tags[keyof Tags];
interface TagInfo extends TagDetails {
    id: string;
}
/**
 * Token instances created from token info on a token list.
 */
export declare class WrappedTokenInfo implements Token {
    readonly isNative: false;
    readonly isToken: true;
    readonly list?: TokenList;
    readonly tokenInfo: TokenInfo;
    constructor(tokenInfo: TokenInfo, list?: TokenList);
    private _checksummedAddress;
    get address(): string;
    get chainId(): number;
    get decimals(): number;
    get name(): string;
    get symbol(): string;
    get logoURI(): string | undefined;
    private _tags;
    get tags(): TagInfo[];
    equals(other: Currency): boolean;
    sortsBefore(other: Token): boolean;
    get wrapped(): Token;
}
export {};
