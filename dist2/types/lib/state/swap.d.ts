import { Currency } from '@uniswap/sdk-core';
export declare enum Field {
    INPUT = "INPUT",
    OUTPUT = "OUTPUT"
}
export interface Swap {
    independentField: Field;
    readonly amount: string;
    readonly [Field.INPUT]?: Currency;
    readonly [Field.OUTPUT]?: Currency;
    integratorFee?: number;
}
export declare const swapAtom: import("jotai").WritableAtom<Swap, Swap | ((draft: import("immer/dist/internal").WritableDraft<Swap>) => void), void>;
export declare const independentFieldAtom: import("jotai").WritableAtom<Field, Field, void>;
export declare const integratorFeeAtom: import("jotai").WritableAtom<number | undefined, number | undefined, void>;
export declare const amountAtom: import("jotai").WritableAtom<string, string, void>;
