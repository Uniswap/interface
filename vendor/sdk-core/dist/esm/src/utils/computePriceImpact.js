import { Percent } from '../entities';
/**
 * Returns the percent difference between the mid price and the execution price, i.e. price impact.
 * @param midPrice mid price before the trade
 * @param inputAmount the input amount of the trade
 * @param outputAmount the output amount of the trade
 */
export function computePriceImpact(midPrice, inputAmount, outputAmount) {
    const quotedOutputAmount = midPrice.quote(inputAmount);
    // calculate price impact := (exactQuote - outputAmount) / exactQuote
    const priceImpact = quotedOutputAmount.subtract(outputAmount).divide(quotedOutputAmount);
    return new Percent(priceImpact.numerator, priceImpact.denominator);
}
//# sourceMappingURL=computePriceImpact.js.map