"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ether = void 0;
const tslib_1 = require("tslib");
const tiny_invariant_1 = tslib_1.__importDefault(require("tiny-invariant"));
const nativeCurrency_1 = require("./nativeCurrency");
const weth9_1 = require("./weth9");
/**
 * Ether is the main usage of a 'native' currency, i.e. for Ethereum mainnet and all testnets
 */
class Ether extends nativeCurrency_1.NativeCurrency {
    constructor(chainId) {
        super(chainId, 18, 'ETH', 'Ether');
    }
    get wrapped() {
        const weth9 = weth9_1.WETH9[this.chainId];
        (0, tiny_invariant_1.default)(!!weth9, 'WRAPPED');
        return weth9;
    }
    static onChain(chainId) {
        var _a;
        return (_a = this._etherCache[chainId]) !== null && _a !== void 0 ? _a : (this._etherCache[chainId] = new Ether(chainId));
    }
    equals(other) {
        return other.isNative && other.chainId === this.chainId;
    }
}
exports.Ether = Ether;
Ether._etherCache = {};
//# sourceMappingURL=ether.js.map