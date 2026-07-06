"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Price = void 0;
const tslib_1 = require("tslib");
const jsbi_1 = tslib_1.__importDefault(require("jsbi"));
const tiny_invariant_1 = tslib_1.__importDefault(require("tiny-invariant"));
const fraction_1 = require("./fraction");
const currencyAmount_1 = require("./currencyAmount");
class Price extends fraction_1.Fraction {
    /**
     * Construct a price, either with the base and quote currency amount, or the
     * @param args
     */
    constructor(...args) {
        let baseCurrency, quoteCurrency, denominator, numerator;
        if (args.length === 4) {
            ;
            [baseCurrency, quoteCurrency, denominator, numerator] = args;
        }
        else {
            const result = args[0].quoteAmount.divide(args[0].baseAmount);
            [baseCurrency, quoteCurrency, denominator, numerator] = [
                args[0].baseAmount.currency,
                args[0].quoteAmount.currency,
                result.denominator,
                result.numerator,
            ];
        }
        super(numerator, denominator);
        this.baseCurrency = baseCurrency;
        this.quoteCurrency = quoteCurrency;
        this.scalar = new fraction_1.Fraction(jsbi_1.default.exponentiate(jsbi_1.default.BigInt(10), jsbi_1.default.BigInt(baseCurrency.decimals)), jsbi_1.default.exponentiate(jsbi_1.default.BigInt(10), jsbi_1.default.BigInt(quoteCurrency.decimals)));
    }
    /**
     * Flip the price, switching the base and quote currency
     */
    invert() {
        return new Price(this.quoteCurrency, this.baseCurrency, this.numerator, this.denominator);
    }
    /**
     * Multiply the price by another price, returning a new price. The other price must have the same base currency as this price's quote currency
     * @param other the other price
     */
    multiply(other) {
        (0, tiny_invariant_1.default)(this.quoteCurrency.equals(other.baseCurrency), 'TOKEN');
        const fraction = super.multiply(other);
        return new Price(this.baseCurrency, other.quoteCurrency, fraction.denominator, fraction.numerator);
    }
    /**
     * Return the amount of quote currency corresponding to a given amount of the base currency
     * @param currencyAmount the amount of base currency to quote against the price
     */
    quote(currencyAmount) {
        (0, tiny_invariant_1.default)(currencyAmount.currency.equals(this.baseCurrency), 'TOKEN');
        const result = super.multiply(currencyAmount);
        return currencyAmount_1.CurrencyAmount.fromFractionalAmount(this.quoteCurrency, result.numerator, result.denominator);
    }
    /**
     * Get the value scaled by decimals for formatting
     * @private
     */
    get adjustedForDecimals() {
        return super.multiply(this.scalar);
    }
    toSignificant(significantDigits = 6, format, rounding) {
        return this.adjustedForDecimals.toSignificant(significantDigits, format, rounding);
    }
    toFixed(decimalPlaces = 4, format, rounding) {
        return this.adjustedForDecimals.toFixed(decimalPlaces, format, rounding);
    }
}
exports.Price = Price;
//# sourceMappingURL=price.js.map