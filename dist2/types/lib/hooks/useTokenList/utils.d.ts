import { TokenInfo, TokenList } from '@uniswap/token-lists';
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo';
declare type TokenMap = Readonly<{
    [tokenAddress: string]: {
        token: WrappedTokenInfo;
        list?: TokenList;
    };
}>;
export declare type ChainTokenMap = Readonly<{
    [chainId: number]: TokenMap;
}>;
export declare function tokensToChainTokenMap(tokens: TokenList | TokenInfo[]): ChainTokenMap;
export {};
