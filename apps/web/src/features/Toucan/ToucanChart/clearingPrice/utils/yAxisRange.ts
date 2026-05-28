/**
 * Target range for scaled values.
 * We want to scale values so they fall within a range that lightweight-charts can display nicely.
 * Values should be scaled to be around 10-1000 for best Y-axis tick rendering.
 */
const TARGET_SCALED_VALUE = 100
// Scale values below 1 to avoid small decimal display issues in lightweight-charts
const REASONABLE_RANGE_MIN = 1
const REASONABLE_RANGE_MAX = 10_000

/**
 * Calculate a scale factor for small price values.
 * Dynamically scales values to bring them into a displayable range (around 100).
 * This ensures lightweight-charts shows meaningful Y-axis labels regardless of how small the values are.
 *
 * For values < 1 (like 0.01), we scale up so the chart displays integers or simple decimals
 * rather than complex multi-decimal values that lightweight-charts struggles to render nicely.
 */
export function calculateScaleFactor(maxValue: number): number {
  if (maxValue <= 0 || !Number.isFinite(maxValue)) {
    return 1
  }

  // If value is already in a reasonable range, no scaling needed
  if (maxValue >= REASONABLE_RANGE_MIN && maxValue <= REASONABLE_RANGE_MAX) {
    return 1
  }

  // Calculate the scale factor needed to bring maxValue to TARGET_SCALED_VALUE
  // For example: maxValue = 0.01, target = 100 → scaleFactor = 10000
  // For example: maxValue = 1e-16, target = 100 → scaleFactor = 1e18
  const scaleFactor = TARGET_SCALED_VALUE / maxValue

  // Round to a nice power of 10 for cleaner display
  const magnitude = Math.ceil(Math.log10(scaleFactor))
  return Math.pow(10, magnitude)
}

/**
 * Calculate a nice step size that rounds to 1, 2, or 5 × 10^n.
 */
function calculateNiceStep(rawStep: number): number {
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const normalized = rawStep / magnitude
  if (normalized <= 1) {
    return magnitude
  } else if (normalized <= 2) {
    return 2 * magnitude
  } else if (normalized <= 5) {
    return 5 * magnitude
  } else {
    return 10 * magnitude
  }
}

/**
 * A tick value for the Y-axis overlay.
 * `value` is in scaled space (matches what the chart series received).
 * `label` is the formatted display string (unscaled via the formatter).
 */
interface YAxisTick {
  value: number
  label: string
}

/**
 * Generate nice Y-axis tick values for the custom overlay.
 *
 * Accepts either an explicit min/max range or an array of values.
 * Returns tick values in scaled space (for priceToCoordinate lookups)
 * with pre-formatted labels (unscaled for display).
 */
export function calculateYAxisTicks({
  min,
  max,
  formatter,
  targetTicks = 15,
}: {
  min: number
  max: number
  formatter: (value: number) => string
  targetTicks?: number
}): YAxisTick[] {
  if (min === max) {
    return []
  }

  const niceStep = calculateNiceStep((max - min) / targetTicks)
  const tickMin = Math.ceil(min / niceStep) * niceStep
  const tickMax = Math.floor(max / niceStep) * niceStep

  const ticks: YAxisTick[] = []
  const tickCount = Math.round((tickMax - tickMin) / niceStep)
  for (let i = 0; i <= tickCount; i++) {
    const value = tickMin + i * niceStep
    ticks.push({ value, label: formatter(value) })
  }

  return ticks
}

/**
 * Calculate the appropriate number of fraction digits for displaying prices.
 * Based on the maximum Y value to ensure precision for small values.
 */
export function calculateMaxFractionDigits(yMax: number): number {
  if (yMax < 0.01) {
    return 8
  }
  if (yMax < 1) {
    return 6
  }
  return 4
}
