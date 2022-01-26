/// <reference types="react" />
import { Token } from '@uniswap/sdk-core';
import { CurrencyModalView } from './CurrencySearchModal';
export default function ManageTokens({ setModalView, setImportToken, }: {
    setModalView: (view: CurrencyModalView) => void;
    setImportToken: (token: Token) => void;
}): JSX.Element;
