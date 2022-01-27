/// <reference types="react" />
import { TokenInfo } from '@uniswap/token-lists';
export declare type DefaultAddress = string | {
    [chainId: number]: string | 'NATIVE';
} | 'NATIVE';
export interface SwapProps {
    tokenList?: string | TokenInfo[];
    defaultInputAddress?: DefaultAddress;
    defaultInputAmount?: string;
    defaultOutputAddress?: DefaultAddress;
    defaultOutputAmount?: string;
    convenienceFee?: number;
    convenienceFeeRecipient?: string | {
        [chainId: number]: string;
    };
}
export default function Swap(props: SwapProps): JSX.Element;
