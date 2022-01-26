/// <reference types="react" />
import { TokenList } from '@uniswap/token-lists';
import { CurrencyModalView } from './CurrencySearchModal';
interface ImportProps {
    listURL: string;
    list: TokenList;
    onDismiss: () => void;
    setModalView: (view: CurrencyModalView) => void;
}
export declare function ImportList({ listURL, list, setModalView, onDismiss }: ImportProps): JSX.Element;
export {};
