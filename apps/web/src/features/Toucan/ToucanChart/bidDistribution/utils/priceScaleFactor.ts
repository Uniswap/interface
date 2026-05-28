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

  // Use actual tick magnitudes (not floored at 1) so sub-wei ticks get a large enough factor.
  // For sub-wei ticks (~1e-20), magnitudes are tiny and we need a factor that maps them to
  // distinct integers: tick * factor should produce values spaced >= 1 apart.
  const maxTickMagnitude = Math.max(Math.abs(minTick), Math.abs(maxTick), Math.abs(clearingPriceDecimal))
  if (maxTickMagnitude === 0) {
    return defaultFactor
  }

  const maxSafeFactor = Math.max(1, Math.floor(Number.MAX_SAFE_INTEGER / maxTickMagnitude))
  if (!Number.isFinite(maxSafeFactor) || maxSafeFactor <= 0) {
    return Math.max(baseFactor, defaultFactor)
  }

  return Math.min(Math.max(baseFactor, defaultFactor), maxSafeFactor)
}
