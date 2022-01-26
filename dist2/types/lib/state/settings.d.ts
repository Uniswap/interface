import { Percent } from '@uniswap/sdk-core';
export declare const TRANSACTION_TTL_DEFAULT = 40;
interface Settings {
    maxSlippage: Percent | 'auto';
    transactionTtl: number | undefined;
    mockTogglable: boolean;
    clientSideRouter: boolean;
}
export declare const settingsAtom: import("jotai").WritableAtom<Settings, typeof import("jotai/utils").RESET | Settings | ((prev: Settings) => Settings), void>;
export declare const maxSlippageAtom: import("jotai").WritableAtom<Percent | "auto", Percent | "auto", void>;
export declare const transactionTtlAtom: import("jotai").WritableAtom<number | undefined, number | undefined, void>;
export declare const mockTogglableAtom: import("jotai").WritableAtom<boolean, unknown, void>;
export declare const clientSideRouterAtom: import("jotai").WritableAtom<boolean, boolean, void>;
export {};
