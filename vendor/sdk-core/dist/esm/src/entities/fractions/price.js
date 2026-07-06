import JSBI from 'jsbi';
import invariant from 'tiny-invariant';
import { Fraction } from './fraction';
import { CurrencyAmount } from './currencyAmount';
export class Price extends Fraction {
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
        this.scalar = new Fraction(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(baseCurrency.decimals)), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(quoteCurrency.decimals)));
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
        invariant(this.quoteCurrency.equals(other.baseCurrency), 'TOKEN');
        const fraction = super.multiply(other);
        return new Price(this.baseCurrency, other.quoteCurrency, fraction.denominator, fraction.numerator);
    }
    /**
     * Return the amount of quote currency corresponding to a given amount of the base currency
     * @param currencyAmount the amount of base currency to quote against the price
     */
    quote(currencyAmount) {
        invariant(currencyAmount.currency.equals(this.baseCurrency), 'TOKEN');
        const result = super.multiply(currencyAmount);
        return CurrencyAmount.fromFractionalAmount(this.quoteCurrency, result.numerator, result.denominator);
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
//# sourceMappingURL=price.js.map