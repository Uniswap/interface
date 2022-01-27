import { Currency } from '@uniswap/sdk-core';
import { Field } from 'lib/state/swap';
export { default as useSwapInfo } from './useSwapInfo';
export declare const amountAtom: import("jotai").WritableAtom<string, string, void>;
export declare function useSwitchSwapCurrencies(): () => void;
export declare function useSwapCurrency(field: Field): [Currency | undefined, (currency?: Currency) => void];
export declare function useSwapAmount(field: Field): [string | undefined, (amount: string) => void];
