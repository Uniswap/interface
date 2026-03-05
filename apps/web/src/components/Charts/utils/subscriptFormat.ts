interface SubscriptNotationParams {
  value: number
  subscriptThreshold: number
  maxSigDigits: number
  minSigDigits?: number
  precision?: number
  trimTrailingZeros?: boolean
}

interface SubscriptNotationResult {
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
  precision = 20,
  trimTrailingZeros = true,
}: SubscriptNotationParams): SubscriptNotationResult | null {
  const absValue = Math.abs(value)
  const str = absValue.toFixed(precision)
  const decimalIndex = str.indexOf('.')
  if (decimalIndex === -1) {
    return null
  }

  let leadingZeros = 0
  for (let i = decimalIndex + 1; i < str.length; i++) {
    if (str[i] === '0') {
      leadingZeros++
    } else {
      break
    }
  }

  if (leadingZeros < subscriptThreshold) {
    return { usesSubscript: false, leadingZeros, significantPart: '' }
  }

  const afterZeros = str.slice(decimalIndex + 1 + leadingZeros)
  const sigDigits = afterZeros.slice(0, maxSigDigits)
  let trimmed = trimTrailingZeros ? sigDigits.replace(/0+$/, '') || '0' : sigDigits

  if (minSigDigits > 0 && trimmed.length < minSigDigits) {
    trimmed = sigDigits.slice(0, minSigDigits)
  }

  return { usesSubscript: true, leadingZeros, significantPart: trimmed }
}
