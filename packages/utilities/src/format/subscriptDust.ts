import { getSubscriptNotationParts } from 'utilities/src/format/getSubscriptNotationParts'
import { toSubscript } from 'utilities/src/format/toSubscript'

/** Subscript kicks in at 4 leading zeros, matching apps/web's Toucan charts. */
const SUBSCRIPT_THRESHOLD = 4
const MAX_SIG_DIGITS = 4
const MIN_SIG_DIGITS = 2

/**
 * The subscript-dust rendering of a sub-1 amount or price ("0.0₅123"), or undefined when the
 * value has fewer than 4 leading zeros (or isn't a positive number under 1) and takes the caller's
 * regular treatment instead. Unsigned and locale-free ("." separator): callers compose any sign
 * or currency symbol around it — getSubscriptNotationParts reads the magnitude, so a negative
 * input is refused here rather than rendered as unsigned dust.
 */
export function subscriptDust(value: number): string | undefined {
  if (!(value > 0) || value >= 1) {
    return undefined
  }
  const parts = getSubscriptNotationParts({
    value,
    subscriptThreshold: SUBSCRIPT_THRESHOLD,
    maxSigDigits: MAX_SIG_DIGITS,
    minSigDigits: MIN_SIG_DIGITS,
  })
  if (parts?.usesSubscript !== true) {
    return undefined
  }
  return `0.0${toSubscript(parts.leadingZeros)}${parts.significantPart}`
}
