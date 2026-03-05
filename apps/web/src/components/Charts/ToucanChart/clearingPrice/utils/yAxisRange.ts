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
 * Result of Y-axis range calculation.
 */
interface YAxisRange {
  /** Unscaled minimum value */
  yMin: number
  /** Unscaled maximum value */
  yMax: number
  /** Scaled minimum value */
  scaledYMin: number
  /** Scaled maximum value */
  scaledYMax: number
}

interface CalculateNiceYRangeParams {
  minValue: number
  maxValue: number
  scaleFactor: number
  maxTicks?: number
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
 * Calculate nice round numbers for Y-axis range based on the data range.
 * This ensures the axis shows readable tick values (e.g., 0.0001, 0.0002, 0.0003).
 *
 * @param minValue
 * @param maxValue
 * @param scaleFactor
 * @param maxTicks - Maximum number of Y-axis ticks allowed (default: 12).
 *                   If the calculated range would produce more ticks, the step size
 *                   is increased to reduce the tick count.
 */
export function calculateNiceYRange({
  minValue,
  maxValue,
  scaleFactor,
  maxTicks = 12,
}: CalculateNiceYRangeParams): YAxisRange {
  if (minValue === maxValue) {
    // All values are the same - add some buffer
    const buffer = minValue === 0 ? 1 : minValue * 0.2
    const yMin = Math.max(0, minValue - buffer)
    const yMax = maxValue + buffer
    return {
      yMin,
      yMax,
      scaledYMin: yMin * scaleFactor,
      scaledYMax: yMax * scaleFactor,
    }
  }

  const range = maxValue - minValue
  // Add 15% buffer on top and bottom
  const buffer = range * 0.15

  let yMin = Math.max(0, minValue - buffer)
  let yMax = maxValue + buffer

  // Find a nice step size for the range
  const targetTicks = 8 // Target number of Y-axis ticks
  const rawStep = (yMax - yMin) / targetTicks
  let niceStep = calculateNiceStep(rawStep)

  // Round yMin down and yMax up to nice step boundaries
  yMin = Math.floor(yMin / niceStep) * niceStep
  yMax = Math.ceil(yMax / niceStep) * niceStep

  // Ensure yMin is not negative for price data
  yMin = Math.max(0, yMin)

  // Check if we have too many ticks and increase step size if needed
  let numTicks = niceStep > 0 ? Math.round((yMax - yMin) / niceStep) : 0
  while (numTicks > maxTicks && niceStep > 0) {
    // Increase step to next nice value (multiply by 2 or 2.5 to jump to next 1/2/5 sequence)
    const currentMagnitude = Math.pow(10, Math.floor(Math.log10(niceStep)))
    const currentNormalized = niceStep / currentMagnitude
    if (currentNormalized < 2) {
      niceStep = 2 * currentMagnitude
    } else if (currentNormalized < 5) {
      niceStep = 5 * currentMagnitude
    } else {
      niceStep = 10 * currentMagnitude
    }

    // Recalculate yMin/yMax with new step
    yMin = Math.floor(Math.max(0, minValue - buffer) / niceStep) * niceStep
    yMax = Math.ceil((maxValue + buffer) / niceStep) * niceStep
    yMin = Math.max(0, yMin)
    numTicks = Math.round((yMax - yMin) / niceStep)
  }

  return {
    yMin,
    yMax,
    scaledYMin: yMin * scaleFactor,
    scaledYMax: yMax * scaleFactor,
  }
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
