/// <reference types="react" />
import { TokenList } from '@uniswap/token-lists';
import { CurrencyModalView } from './CurrencySearchModal';
export declare function ManageLists({ setModalView, setImportList, setListUrl, }: {
    setModalView: (view: CurrencyModalView) => void;
    setImportList: (list: TokenList) => void;
    setListUrl: (url: string) => void;
}): JSX.Element;
