/// <reference types="react" />
import { Token } from '@uniswap/sdk-core';
import { TokenList } from '@uniswap/token-lists';
interface TokenImportCardProps {
    list?: TokenList;
    token: Token;
}
declare const TokenImportCard: ({ list, token }: TokenImportCardProps) => JSX.Element;
export default TokenImportCard;
