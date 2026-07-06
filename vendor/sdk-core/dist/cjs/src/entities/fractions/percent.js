"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Percent = void 0;
const tslib_1 = require("tslib");
const jsbi_1 = tslib_1.__importDefault(require("jsbi"));
const fraction_1 = require("./fraction");
const ONE_HUNDRED = new fraction_1.Fraction(jsbi_1.default.BigInt(100));
/**
 * Converts a fraction to a percent
 * @param fraction the fraction to convert
 */
function toPercent(fraction) {
    return new Percent(fraction.numerator, fraction.denominator);
}
class Percent extends fraction_1.Fraction {
    constructor() {
        super(...arguments);
        /**
         * This boolean prevents a fraction from being interpreted as a Percent
         */
        this.isPercent = true;
    }
    add(other) {
        return toPercent(super.add(other));
    }
    subtract(other) {
        return toPercent(super.subtract(other));
    }
    multiply(other) {
        return toPercent(super.multiply(other));
    }
    divide(other) {
        return toPercent(super.divide(other));
    }
    toSignificant(significantDigits = 5, format, rounding) {
        return super.multiply(ONE_HUNDRED).toSignificant(significantDigits, format, rounding);
    }
    toFixed(decimalPlaces = 2, format, rounding) {
        return super.multiply(ONE_HUNDRED).toFixed(decimalPlaces, format, rounding);
    }
}
exports.Percent = Percent;
//# sourceMappingURL=percent.js.map