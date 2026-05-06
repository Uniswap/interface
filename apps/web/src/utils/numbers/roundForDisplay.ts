/**
 * Threshold for rounding up to a "nice" number.
 * If a value's significant digits are >= this fraction of the next power of 10, round up.
 * For example, 0.999 means 9.99... rounds up to 10 (next order of magnitude).
 */
const ROUND_UP_THRESHOLD = 0.999

/**
 * Rounds a number to a specified number of significant figures.
 */
function roundToSigFigs(value: number, sigFigs: number): number {
  if (value === 0 || !Number.isFinite(value)) {
    return value
  }

  const absValue = Math.abs(value)
  const magnitude = Math.floor(Math.log10(absValue))
  const scale = Math.pow(10, sigFigs - 1 - magnitude)
  const rounded = Math.round(absValue * scale) / scale

  return value < 0 ? -rounded : rounded
}

/**
 * Rounds a small decimal number to the nearest "nice" value for display purposes.
 *
 * Handles edge cases where fixed-point or float arithmetic produces values like
 * 0.00000999... that are semantically meant to be 0.00001.
 *
 * @param value - The value to round
 * @param sigFigs - Number of significant figures to keep (default: 4)
 */
export function roundForDisplay(value: number, sigFigs: number = 4): number {
  if (value === 0 || !Number.isFinite(value)) {
    return value
  }

  const absValue = Math.abs(value)

  if (absValue >= 1) {
    return roundToSigFigs(value, sigFigs)
  }

  const log10Value = Math.log10(absValue)
  const magnitude = Math.floor(log10Value)
  const scaleFactor = Math.pow(10, magnitude)
  const coefficient = absValue / scaleFactor

  if (coefficient >= 10 * ROUND_UP_THRESHOLD) {
    const roundedAbs = Math.pow(10, magnitude + 1)
    return value < 0 ? -roundedAbs : roundedAbs
  }

  return roundToSigFigs(value, sigFigs)
}
