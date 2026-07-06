"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeCurrency = void 0;
const baseCurrency_1 = require("./baseCurrency");
/**
 * Represents the native currency of the chain on which it resides, e.g.
 */
class NativeCurrency extends baseCurrency_1.BaseCurrency {
    constructor() {
        super(...arguments);
        this.isNative = true;
        this.isToken = false;
    }
}
exports.NativeCurrency = NativeCurrency;
//# sourceMappingURL=nativeCurrency.js.map