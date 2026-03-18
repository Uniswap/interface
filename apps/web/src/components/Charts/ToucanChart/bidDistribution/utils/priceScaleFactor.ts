/**
 * Lightweight-charts requires x-axis values to be strictly increasing integers.
 * For Toucan we repurpose the time axis to represent tick prices; this helper
 * computes a stable scaling factor to convert decimal ticks into safe integers.
 */
export function calculatePriceScaleFactor(params: {
  tickSizeDecimal: number
  minTick: number
  maxTick: number
  clearingPriceDecimal: number
  defaultFactor?: number
}): number {
  const { tickSizeDecimal, minTick, maxTick, clearingPriceDecimal, defaultFactor = 10_000 } = params

  if (!Number.isFinite(tickSizeDecimal) || tickSizeDecimal <= 0) {
    return defaultFactor
  }

  const baseFactor = Math.ceil(1 / tickSizeDecimal)
  if (!Number.isFinite(baseFactor) || baseFactor <= 0) {
    return defaultFactor
  }

  const maxTickMagnitude = Math.max(Math.abs(minTick), Math.abs(maxTick), Math.abs(clearingPriceDecimal), 1)
  const maxSafeFactor = Math.max(1, Math.floor(Number.MAX_SAFE_INTEGER / maxTickMagnitude))
  if (!Number.isFinite(maxSafeFactor) || maxSafeFactor <= 0) {
    return Math.max(baseFactor, defaultFactor)
  }

  return Math.min(Math.max(baseFactor, defaultFactor), maxSafeFactor)
}
