import { BaseCurrency } from './baseCurrency';
/**
 * Represents the native currency of the chain on which it resides, e.g.
 */
export class NativeCurrency extends BaseCurrency {
    constructor() {
        super(...arguments);
        this.isNative = true;
        this.isToken = false;
    }
}
//# sourceMappingURL=nativeCurrency.js.map