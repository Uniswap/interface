export declare enum Field {
    INPUT = "INPUT",
    OUTPUT = "OUTPUT"
}
export declare const selectCurrency: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    field: Field;
    currencyId: string;
}, string>;
export declare const switchCurrencies: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<string>;
export declare const typeInput: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    field: Field;
    typedValue: string;
}, string>;
export declare const replaceSwapState: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    field: Field;
    typedValue: string;
    inputCurrencyId?: string | undefined;
    outputCurrencyId?: string | undefined;
    recipient: string | null;
}, string>;
export declare const setRecipient: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    recipient: string | null;
}, string>;
