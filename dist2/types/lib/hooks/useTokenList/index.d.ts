import { Token } from '@uniswap/sdk-core';
import { TokenInfo } from '@uniswap/token-lists';
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo';
export { DEFAULT_TOKEN_LIST } from './fetchTokenList';
export default function useTokenList(list?: string | TokenInfo[]): WrappedTokenInfo[];
export declare type TokenMap = {
    [address: string]: Token;
};
export declare function useTokenMap(): TokenMap;
export declare function useQueryTokenList(query: string): (import("@uniswap/sdk-core").NativeCurrency | WrappedTokenInfo)[];
