import type { TokenInfo, TokenList } from '@uniswap/token-lists';
/**
 * Validates an array of tokens.
 * @param json the TokenInfo[] to validate
 */
export declare function validateTokens(json: TokenInfo[]): Promise<TokenInfo[]>;
/**
 * Validates a token list.
 * @param json the TokenList to validate
 */
export default function validateTokenList(json: TokenList): Promise<TokenList>;
