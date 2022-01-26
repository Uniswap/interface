import type { TokenList } from '@uniswap/token-lists';
export declare const DEFAULT_TOKEN_LIST = "https://gateway.ipfs.io/ipns/tokens.uniswap.org";
/** Fetches and validates a token list. */
export default function fetchTokenList(listUrl: string, resolveENSContentHash: (ensName: string) => Promise<string>): Promise<TokenList>;
