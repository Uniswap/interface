import { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { TokenList } from '@uniswap/token-lists';
export declare const fetchTokenList: Readonly<{
    pending: ActionCreatorWithPayload<{
        url: string;
        requestId: string;
    }>;
    fulfilled: ActionCreatorWithPayload<{
        url: string;
        tokenList: TokenList;
        requestId: string;
    }>;
    rejected: ActionCreatorWithPayload<{
        url: string;
        errorMessage: string;
        requestId: string;
    }>;
}>;
export declare const addList: ActionCreatorWithPayload<string, string>;
export declare const removeList: ActionCreatorWithPayload<string, string>;
export declare const enableList: ActionCreatorWithPayload<string, string>;
export declare const disableList: ActionCreatorWithPayload<string, string>;
export declare const acceptListUpdate: ActionCreatorWithPayload<string, string>;
