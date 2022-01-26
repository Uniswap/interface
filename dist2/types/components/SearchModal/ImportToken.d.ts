/// <reference types="react" />
import { Currency, Token } from '@uniswap/sdk-core';
import { TokenList } from '@uniswap/token-lists';
interface ImportProps {
    tokens: Token[];
    list?: TokenList;
    onBack?: () => void;
    onDismiss?: () => void;
    handleCurrencySelect?: (currency: Currency) => void;
}
export declare function ImportToken(props: ImportProps): JSX.Element;
export {};
