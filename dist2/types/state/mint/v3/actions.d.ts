export declare enum Field {
    CURRENCY_A = "CURRENCY_A",
    CURRENCY_B = "CURRENCY_B"
}
export declare enum Bound {
    LOWER = "LOWER",
    UPPER = "UPPER"
}
export declare const typeInput: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    field: Field;
    typedValue: string;
    noLiquidity: boolean;
}, string>;
export declare const typeStartPriceInput: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    typedValue: string;
}, string>;
export declare const typeLeftRangeInput: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    typedValue: string;
}, string>;
export declare const typeRightRangeInput: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    typedValue: string;
}, string>;
export declare const resetMintState: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<string>;
export declare const setFullRange: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<string>;
