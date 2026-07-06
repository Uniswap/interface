import { BaseCurrency } from './baseCurrency';
/**
 * Represents the native currency of the chain on which it resides, e.g.
 */
export declare abstract class NativeCurrency extends BaseCurrency {
    readonly isNative: true;
    readonly isToken: false;
}
