import JSBI from 'jsbi';
import { Fraction } from './fraction';
const ONE_HUNDRED = new Fraction(JSBI.BigInt(100));
/**
 * Converts a fraction to a percent
 * @param fraction the fraction to convert
 */
function toPercent(fraction) {
    return new Percent(fraction.numerator, fraction.denominator);
}
export class Percent extends Fraction {
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
//# sourceMappingURL=percent.js.map