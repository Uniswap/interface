export interface GetSubscriptNotationParams {
  value: number
  subscriptThreshold: number
  maxSigDigits: number
  minSigDigits?: number
  precision?: number
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
  precision = 20,
  trimTrailingZeros = true,
}: GetSubscriptNotationParams): SubscriptNotationResult | null {
  const absValue = Math.abs(value)
  // Adaptively widen precision for ultra-small values so the leading-zero block plus
  // sig-digit window all fit inside the formatted string. Without this, values below
  // ~1e-20 collapse to "0.000…0" with no significant digit to display (rendering as
  // "0.0₂₀" instead of "0.0₂₀10" etc). Capped at 100 — the upper bound of
  // `Number.prototype.toFixed`.
  const magnitude = absValue > 0 ? Math.floor(Math.log10(absValue)) : 0
  const requiredPrecision = magnitude < 0 ? -magnitude + maxSigDigits + 1 : precision
  const effectivePrecision = Math.min(100, Math.max(precision, requiredPrecision))
  const str = absValue.toFixed(effectivePrecision)
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
