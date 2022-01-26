/// <reference types="react" />
import { TokenInfo } from '@uniswap/token-lists';
interface DefaultTokenAmount {
    address?: string | {
        [chainId: number]: string;
    };
    amount?: number;
}
interface SwapDefaults {
    tokenList: string | TokenInfo[];
    input: DefaultTokenAmount;
    output: DefaultTokenAmount;
}
export interface SwapProps {
    convenienceFee?: number;
    convenienceFeeRecipient?: string;
    defaults?: Partial<SwapDefaults>;
}
export default function Swap({ defaults }: SwapProps): JSX.Element;
export {};
