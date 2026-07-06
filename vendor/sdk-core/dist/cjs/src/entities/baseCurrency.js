"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCurrency = void 0;
const tslib_1 = require("tslib");
const tiny_invariant_1 = tslib_1.__importDefault(require("tiny-invariant"));
/**
 * A currency is any fungible financial instrument, including Ether, all ERC20 tokens, and other chain-native currencies
 */
class BaseCurrency {
    /**
     * Constructs an instance of the base class `BaseCurrency`.
     * @param chainId the chain ID on which this currency resides
     * @param decimals decimals of the currency
     * @param symbol symbol of the currency
     * @param name of the currency
     */
    constructor(chainId, decimals, symbol, name) {
        (0, tiny_invariant_1.default)(Number.isSafeInteger(chainId), 'CHAIN_ID');
        (0, tiny_invariant_1.default)(decimals >= 0 && decimals < 255 && Number.isInteger(decimals), 'DECIMALS');
        this.chainId = chainId;
        this.decimals = decimals;
        this.symbol = symbol;
        this.name = name;
    }
}
exports.BaseCurrency = BaseCurrency;
//# sourceMappingURL=baseCurrency.js.map