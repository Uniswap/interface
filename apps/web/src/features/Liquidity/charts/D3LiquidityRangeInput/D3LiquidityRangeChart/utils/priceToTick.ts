import type { Currency } from '@uniswap/sdk-core'
import { TickMath } from '@uniswap/v3-sdk'

const LN_TICK_BASE = Math.log(1.0001)
const LN_TEN = Math.log(10)

/**
 * Continuous inverse of `getDisplayPriceFromTick`: the (fractional, unclamped-to-spacing) tick at
 * which `price` quote-per-base sits, clamped to the valid tick range.
 *
 * A display price is the raw `1.0001^tick` ratio scaled by `10^(baseDecimals - quoteDecimals)`, so
 * the decimal scale is undone before taking the log. Works in whichever tick space the currencies
 * are given in: passing the visual base/quote (already swapped when priceInverted) yields the
 * visual tick, matching how the chart's tick scale and `getDisplayPriceFromTick` read ticks.
 */
export function priceToTick({
  price,
  baseCurrency,
  quoteCurrency,
}: {
  price: number
  baseCurrency: Maybe<Currency>
  quoteCurrency: Maybe<Currency>
}): number {
  return priceToTickWithDecimals({
    price,
    baseDecimals: baseCurrency?.decimals ?? 0,
    quoteDecimals: quoteCurrency?.decimals ?? 0,
  })
}

/** `priceToTick` from the base and quote decimals alone. */
export function priceToTickWithDecimals({
  price,
  baseDecimals,
  quoteDecimals,
}: {
  price: number
  baseDecimals: number
  quoteDecimals: number
}): number {
  // log of a non-positive price is -Infinity or NaN; both belong at the bottom of the scale. +Infinity
  // needs no special case: its log is +Infinity, which the clamp below sends to the top.
  if (!(price > 0)) {
    return TickMath.MIN_TICK
  }
  const decimalsDelta = baseDecimals - quoteDecimals
  const tick = (Math.log(price) - decimalsDelta * LN_TEN) / LN_TICK_BASE
  return Math.max(TickMath.MIN_TICK, Math.min(TickMath.MAX_TICK, tick))
}
