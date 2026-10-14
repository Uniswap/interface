export interface GetSubscriptNotationParams {
  value: number
  subscriptThreshold: number
  maxSigDigits: number
  minSigDigits?: number
  trimTrailingZeros?: boolean
}

export interface SubscriptNotationResult {
  usesSubscript: boolean
  leadingZeros: number
  significantPart: string
}

/**
 * Parse a number for subscript notation display.
 * Returns the leading zero count and significant digits when subscript is needed.
 */
export function getSubscriptNotationParts({
  value,
  subscriptThreshold,
  maxSigDigits,
  minSigDigits = 0,
  trimTrailingZeros = true,
}: GetSubscriptNotationParams): SubscriptNotationResult | null {
  const absValue = Math.abs(value)
  if (!Number.isFinite(absValue) || absValue === 0) {
    return null
  }

  // Derive digits from a decimally-rounded representation. Slicing `toFixed(20)` truncates,
  // and many floats sit one ulp below their decimal value (0.00007 → "0.0000699999…"),
  // which corrupted the displayed digits (rendering "0.0₄6999" instead of "0.0₄70").
  const [mantissa = '', expPart = ''] = absValue.toExponential(maxSigDigits - 1).split('e')
  const exponent = Number(expPart)
  // Rounding can carry into the next magnitude (0.000099999 → "1.000e-4"), so leading
  // zeros must come from the rounded exponent, not from scanning the raw decimal string.
  const leadingZeros = exponent < 0 ? -exponent - 1 : 0

  if (leadingZeros < subscriptThreshold) {
    return { usesSubscript: false, leadingZeros, significantPart: '' }
  }

  const sigDigits = mantissa.replace('.', '')
  let trimmed = trimTrailingZeros ? sigDigits.replace(/0+$/, '') || '0' : sigDigits

  if (minSigDigits > 0 && trimmed.length < minSigDigits) {
    trimmed = sigDigits.slice(0, minSigDigits)
  }

  return { usesSubscript: true, leadingZeros, significantPart: trimmed }
}
