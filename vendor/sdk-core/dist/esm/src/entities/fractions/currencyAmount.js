import invariant from 'tiny-invariant';
import JSBI from 'jsbi';
import { Fraction } from './fraction';
import _Big from 'big.js';
import toFormat from 'toformat';
import { Rounding, MaxUint256 } from '../../constants';
const Big = toFormat(_Big);
export class CurrencyAmount extends Fraction {
    /**
     * Returns a new currency amount instance from the unitless amount of token, i.e. the raw amount
     * @param currency the currency in the amount
     * @param rawAmount the raw token or ether amount
     */
    static fromRawAmount(currency, rawAmount) {
        return new CurrencyAmount(currency, rawAmount);
    }
    /**
     * Construct a currency amount with a denominator that is not equal to 1
     * @param currency the currency
     * @param numerator the numerator of the fractional token amount
     * @param denominator the denominator of the fractional token amount
     */
    static fromFractionalAmount(currency, numerator, denominator) {
        return new CurrencyAmount(currency, numerator, denominator);
    }
    constructor(currency, numerator, denominator) {
        super(numerator, denominator);
        invariant(JSBI.lessThanOrEqual(this.quotient, MaxUint256), 'AMOUNT');
        this.currency = currency;
        this.decimalScale = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(currency.decimals));
    }
    add(other) {
        invariant(this.currency.equals(other.currency), 'CURRENCY');
        const added = super.add(other);
        return CurrencyAmount.fromFractionalAmount(this.currency, added.numerator, added.denominator);
    }
    subtract(other) {
        invariant(this.currency.equals(other.currency), 'CURRENCY');
        const subtracted = super.subtract(other);
        return CurrencyAmount.fromFractionalAmount(this.currency, subtracted.numerator, subtracted.denominator);
    }
    multiply(other) {
        const multiplied = super.multiply(other);
        return CurrencyAmount.fromFractionalAmount(this.currency, multiplied.numerator, multiplied.denominator);
    }
    divide(other) {
        const divided = super.divide(other);
        return CurrencyAmount.fromFractionalAmount(this.currency, divided.numerator, divided.denominator);
    }
    toSignificant(significantDigits = 6, format, rounding = Rounding.ROUND_DOWN) {
        return super.divide(this.decimalScale).toSignificant(significantDigits, format, rounding);
    }
    toFixed(decimalPlaces = this.currency.decimals, format, rounding = Rounding.ROUND_DOWN) {
        invariant(decimalPlaces <= this.currency.decimals, 'DECIMALS');
        return super.divide(this.decimalScale).toFixed(decimalPlaces, format, rounding);
    }
    toExact(format = { groupSeparator: '' }) {
        Big.DP = this.currency.decimals;
        return new Big(this.quotient.toString()).div(this.decimalScale.toString()).toFormat(format);
    }
    get wrapped() {
        if (this.currency.isToken)
            return this;
        return CurrencyAmount.fromFractionalAmount(this.currency.wrapped, this.numerator, this.denominator);
    }
}
//# sourceMappingURL=currencyAmount.js.map