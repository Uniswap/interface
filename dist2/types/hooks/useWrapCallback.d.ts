/// <reference types="react" />
import { Currency } from '@uniswap/sdk-core';
export declare enum WrapType {
    NOT_APPLICABLE = 0,
    WRAP = 1,
    UNWRAP = 2
}
declare enum WrapInputError {
    NO_ERROR = 0,
    ENTER_NATIVE_AMOUNT = 1,
    ENTER_WRAPPED_AMOUNT = 2,
    INSUFFICIENT_NATIVE_BALANCE = 3,
    INSUFFICIENT_WRAPPED_BALANCE = 4
}
export declare function WrapErrorText({ wrapInputError }: {
    wrapInputError: WrapInputError;
}): JSX.Element | null;
/**
 * Given the selected input and output currency, return a wrap callback
 * @param inputCurrency the selected input currency
 * @param outputCurrency the selected output currency
 * @param typedValue the user input value
 */
export default function useWrapCallback(inputCurrency: Currency | undefined | null, outputCurrency: Currency | undefined | null, typedValue: string | undefined): {
    wrapType: WrapType;
    execute?: undefined | (() => Promise<void>);
    inputError?: WrapInputError;
};
export {};
