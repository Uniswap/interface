/// <reference types="react" />
import { Token } from '@uniswap/sdk-core';
import { TokenList } from '@uniswap/token-lists';
import { CurrencyModalView } from './CurrencySearchModal';
export default function Manage({ onDismiss, setModalView, setImportList, setImportToken, setListUrl, }: {
    onDismiss: () => void;
    setModalView: (view: CurrencyModalView) => void;
    setImportToken: (token: Token) => void;
    setImportList: (list: TokenList) => void;
    setListUrl: (url: string) => void;
}): JSX.Element;
