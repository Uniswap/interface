import { Price, Token } from '@uniswap/sdk-core';
import { Bound } from '../state/mint/v3/actions';
export declare function formatTickPrice(price: Price<Token, Token> | undefined, atLimit: {
    [bound in Bound]?: boolean | undefined;
}, direction: Bound, placeholder?: string): string;
