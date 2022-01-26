export declare enum Field {
    CURRENCY_A = "CURRENCY_A",
    CURRENCY_B = "CURRENCY_B"
}
export declare const typeInput: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    field: Field;
    typedValue: string;
    noLiquidity: boolean;
}, string>;
export declare const resetMintState: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<string>;
