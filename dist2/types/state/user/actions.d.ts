import { SupportedLocale } from 'constants/locales';
export interface SerializedToken {
    chainId: number;
    address: string;
    decimals: number;
    symbol?: string;
    name?: string;
}
export interface SerializedPair {
    token0: SerializedToken;
    token1: SerializedToken;
}
export declare const updateMatchesDarkMode: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    matchesDarkMode: boolean;
}, string>;
export declare const updateUserDarkMode: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    userDarkMode: boolean;
}, string>;
export declare const updateUserExpertMode: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    userExpertMode: boolean;
}, string>;
export declare const updateUserLocale: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    userLocale: SupportedLocale;
}, string>;
export declare const updateShowSurveyPopup: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    showSurveyPopup: boolean;
}, string>;
export declare const updateUserClientSideRouter: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    userClientSideRouter: boolean;
}, string>;
export declare const updateHideClosedPositions: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    userHideClosedPositions: boolean;
}, string>;
export declare const updateUserSlippageTolerance: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    userSlippageTolerance: number | 'auto';
}, string>;
export declare const updateUserDeadline: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    userDeadline: number;
}, string>;
export declare const addSerializedToken: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    serializedToken: SerializedToken;
}, string>;
export declare const removeSerializedToken: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    chainId: number;
    address: string;
}, string>;
export declare const addSerializedPair: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    serializedPair: SerializedPair;
}, string>;
export declare const removeSerializedPair: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    chainId: number;
    tokenAAddress: string;
    tokenBAddress: string;
}, string>;
