"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computePriceImpact = void 0;
const entities_1 = require("../entities");
/**
 * Returns the percent difference between the mid price and the execution price, i.e. price impact.
 * @param midPrice mid price before the trade
 * @param inputAmount the input amount of the trade
 * @param outputAmount the output amount of the trade
 */
function computePriceImpact(midPrice, inputAmount, outputAmount) {
    const quotedOutputAmount = midPrice.quote(inputAmount);
    // calculate price impact := (exactQuote - outputAmount) / exactQuote
    const priceImpact = quotedOutputAmount.subtract(outputAmount).divide(quotedOutputAmount);
    return new entities_1.Percent(priceImpact.numerator, priceImpact.denominator);
}
exports.computePriceImpact = computePriceImpact;
//# sourceMappingURL=computePriceImpact.js.map