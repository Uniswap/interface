import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'

/**
 * Express a price as an amount of its quote currency (price magnitude == quote per 1 base) so it
 * can be run through the USDC pricing hook. Uses `price.quote(1 base)` rather than a
 * `price.toFixed()` string round-trip, which rounds to 4 decimals and loses long-tail prices.
 */
export function priceToQuoteAmount(price?: Price<Currency, Currency>): CurrencyAmount<Currency> | undefined {
  if (!price) {
    return undefined
  }
  try {
    const oneBase = CurrencyAmount.fromRawAmount(price.baseCurrency, `1${'0'.repeat(price.baseCurrency.decimals)}`)
    return price.quote(oneBase)
  } catch {
    return undefined
  }
}
